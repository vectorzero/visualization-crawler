import { useState, useEffect, useRef } from 'react';
import { Button, Input, Tooltip, Image, Select, Modal } from 'antd';
import { InfoCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import step1 from '../assets/tips/step1.png';
import step2 from '../assets/tips/step2.png';
import './index.css';

const { ipcRenderer } = window.electron;
const { Option } = Select;

export default function Index() {
  const [typeList] = useState([
    { label: '跳转', value: 'jump' },
    { label: '单击', value: 'click' },
    { label: '双击', value: 'dbclick' },
    { label: '输入', value: 'input' },
  ]);
  const [list, setList] = useState([]);
  const [logs, setLogs] = useState([]);
  const logRef = useRef(null);

  const changeInput = (e, id, prop) => {
    const val = e.target.value;
    list.forEach((item) => {
      if (item.id === id) {
        item[prop] = val;
      }
    });
    const newArr = [...list];
    setList(newArr);
  };

  const changeSelect = (val, id) => {
    list.forEach((item) => {
      if (item.id === id) {
        item.type = val;
        if (val !== 'input') {
          item.value = '';
        }
      }
    });
    const newArr = [...list];
    setList(newArr);
  };

  const handleStart = () => {
    ipcRenderer.crawler(list);
    localStorage.setItem('list', JSON.stringify(list));
  };

  const handleAdd = () => {
    list.push({
      id: new Date().getTime().toString(),
      type: 'jump',
      target: '',
      value: '',
    });
    const newArr = [...list];
    setList(newArr);
  };

  const handleDelete = (id) => {
    const newList = list.filter((v) => v.id !== id);
    setList(newList);
    localStorage.setItem('list', JSON.stringify(newList));
  };

  const scrollToBottom = () => {
    if (logRef && logRef.current) {
      logRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const [modal, contextHolder] = Modal.useModal();

  const tips = {
    title: '获取selector',
    content: (
      <div className="tip-wrap">
        <Image width={220} src={step1} />
        <Image width={220} src={step2} />
      </div>
    ),
  };

  useEffect(() => {
    const str = localStorage.getItem('list');
    if (str) {
      setList(JSON.parse(str));
    }
    ipcRenderer.on('crawler', (arg) => {
      let newLogs = [];
      logs.push(arg);
      newLogs = logs.filter(
        (item, index, self) =>
          self.findIndex((el) => el.id === item.id) === index
      );
      setLogs(newLogs);
      scrollToBottom();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page-wrap">
      <Button type="primary" onClick={handleAdd}>
        新增步骤
      </Button>
      <div className="step-wrap">
        {list.map((item) => {
          return (
            <div className="step-item" key={item.id}>
              <Tooltip title="删除">
                <Button
                  className="del-btn"
                  danger
                  shape="circle"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(item.id)}
                />
              </Tooltip>
              <Select
                value={item.type}
                onChange={(e) => changeSelect(e, item.id)}
              >
                {typeList.map((v) => {
                  return (
                    <Option value={v.value} key={v.value}>
                      {v.label}
                    </Option>
                  );
                })}
              </Select>
              {item.type === 'jump' ? (
                <Input
                  className="input-item"
                  value={item.target}
                  onChange={(e) => changeInput(e, item.id, 'target')}
                  placeholder="请输入网址"
                />
              ) : (
                <>
                  <Input
                    className="input-item"
                    value={item.target}
                    onChange={(e) => changeInput(e, item.id, 'target')}
                    placeholder="请输入selector"
                  />
                  <Tooltip title="点击查看如何获取selector">
                    <Button
                      icon={<InfoCircleOutlined />}
                      onClick={() => {
                        modal.info(tips);
                      }}
                    />
                  </Tooltip>
                </>
              )}
              {item.type === 'input' && (
                <Input
                  className="input-item"
                  value={item.value}
                  onChange={(e) => changeInput(e, item.id, 'value')}
                  placeholder="请输入填写的文本"
                />
              )}
            </div>
          );
        })}
      </div>
      {Boolean(list.length) && (
        <Button type="primary" onClick={handleStart}>
          执行
        </Button>
      )}
      <div className="log-wrap" ref={logRef}>
        {logs.map((item) => {
          return (
            <div className="log-item" key={item.id}>
              <span className="text-date">{item.date}</span>
              <span className={`${item.type === 'error' ? 'text-warn' : ''}`}>
                {item.msg}
              </span>
            </div>
          );
        })}
      </div>
      {contextHolder}
    </div>
  );
}
