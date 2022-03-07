import { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Tooltip,
  Image,
  Select,
  Modal,
  InputNumber,
} from 'antd';
import {
  InfoCircleOutlined,
  DeleteOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import step1 from '../assets/tips/step1.png';
import step2 from '../assets/tips/step2.png';
import keyboards from './keyboard';
import './index.css';

const { ipcRenderer } = window.electron;
const { Option } = Select;

export default function Index() {
  const [typeList] = useState([
    { label: '跳转', value: 'jump' },
    { label: '存在', value: 'exist' },
    { label: '单击', value: 'click' },
    { label: '双击', value: 'dbclick' },
    { label: '输入', value: 'input' },
    { label: '按键', value: 'keyboard' },
    { label: '运行js', value: 'js' },
    { label: '等待', value: 'wait' },
    { label: '刷新页面', value: 'reload' },
  ]);
  const [pressTypes] = useState(['持续按着', '按一下', '释放按键']);
  const [list, setList] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loopTimes, setLoopTimes] = useState(1)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLogVisible, setIsLogVisible] = useState(false);

  const changeVal = (val, id, prop) => {
    list.forEach((item) => {
      if (item.id === id) {
        item[prop] = val;
      }
    });
    const newArr = [...list];
    setList(newArr);
  };

  const changeInput = (e, id, prop) => {
    const val = e.target.value;
    changeVal(val, id, prop);
  };

  const changeInputNumber = (val, id, prop) => {
    changeVal(val, id, prop);
  };

  const changeSelect = (val, id, prop = 'type') => {
    list.forEach((item) => {
      if (item.id === id) {
        item[prop] = val;
      }
    });
    const newArr = [...list];
    setList(newArr);
  };

  const handleStart = () => {
    ipcRenderer.crawler({times: loopTimes, list});
    setIsLogVisible(true);
    localStorage.setItem('list', JSON.stringify(list));
    localStorage.setItem('loopTimes', loopTimes.toString())
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

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleLogClose = () => {
    setIsLogVisible(false);
  };

  const toggleLogVisible = () => {
    const isVisible = !isLogVisible
    setIsLogVisible(isVisible);
  };

  const changeTimes = val => {
    setLoopTimes(val)
  };

  useEffect(() => {
    const times = localStorage.getItem('loopTimes')
    setLoopTimes(Number(times))
    const str = localStorage.getItem('list');
    if (str) {
      setList(JSON.parse(str));
    }
    ipcRenderer.on('crawler', (arg) => {
      let newLogs = [];
      logs.unshift(arg);
      newLogs = logs.filter(
        (item, index, self) =>
          self.findIndex((el) => el.id === item.id) === index
      );
      setLogs(newLogs);
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
                <DeleteOutlined
                  className="del-btn"
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
              {['jump'].includes(item.type) && (
                <Input
                  className="input-item"
                  value={item.target}
                  onChange={(e) => changeInput(e, item.id, 'target')}
                  placeholder="请输入网址"
                />
              )}
              {['click', 'dbclick', 'input', 'exist'].includes(item.type) && (
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
                        setIsModalVisible(true);
                      }}
                    />
                  </Tooltip>
                </>
              )}
              {['input', 'js'].includes(item.type) && (
                <Input
                  className="input-item"
                  value={item.value}
                  onChange={(e) => changeInput(e, item.id, 'value')}
                  placeholder="请填写值"
                />
              )}
              {['wait'].includes(item.type) && (
                <InputNumber
                  className="input-item"
                  value={item.value}
                  onChange={(e) => changeInputNumber(e, item.id, 'value')}
                  placeholder="请填写时间"
                  addonAfter="ms"
                />
              )}
              {['keyboard'].includes(item.type) && (
                <>
                  <Select
                    className="select-item"
                    showSearch
                    placeholder="选择按压方式"
                    optionFilterProp="children"
                    value={item.target}
                    onChange={(e) => changeSelect(e, item.id, 'target')}
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {pressTypes.map((k) => (
                      <Option value={k} key={k}>
                        {k}
                      </Option>
                    ))}
                  </Select>
                  <Select
                    className="select-item"
                    showSearch
                    placeholder="选择按键"
                    optionFilterProp="children"
                    value={item.value}
                    onChange={(e) => changeSelect(e, item.id, 'value')}
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {keyboards.map((k) => (
                      <Option value={k} key={k}>
                        {k}
                      </Option>
                    ))}
                  </Select>
                </>
              )}
            </div>
          );
        })}
      </div>
      {Boolean(list.length) && (
        <div className='operate-item'>
          <div className='input-time'>
            <span>循环次数</span>
            <InputNumber className='num-item' onChange={(e) => changeTimes(e)} value={loopTimes}></InputNumber>
          </div>
          <Button
            style={{ marginRight: '10px' }}
            type="primary"
            onClick={handleStart}
          >
            执行
          </Button>
          <Button
            onClick={() => {
              toggleLogVisible();
            }}
          >
            { isLogVisible ? '关闭' : '打开' }日志
          </Button>
        </div>
      )}

      <Modal
        title="获取selector"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
      >
        <div className="tip-wrap">
          <Image width={220} src={step1} />
          <Image width={220} src={step2} />
        </div>
      </Modal>
      {isLogVisible && (
        <div className="log-wrap">
          <div className="log-title">
            <CloseCircleOutlined
              className="close-btn"
              onClick={handleLogClose}
            />
          </div>
          <div className="log-content">
            {logs.map((item) => {
              return (
                <div className="log-item" key={item.id}>
                  <span className="text-date">{item.date}</span>
                  <span
                    className={`${item.type === 'error' ? 'text-warn' : ''}`}
                  >
                    {item.msg}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
