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
    { label: '双击', value: 'dblclick' },
    { label: '输入', value: 'input' },
    { label: '键盘', value: 'keyboard' },
    { label: '鼠标', value: 'mouse' },
    { label: '运行js', value: 'js' },
    { label: '等待', value: 'wait' },
    { label: '网页截图', value: 'screenshot' },
    { label: '抓取图片', value: 'image' },
    { label: '抓取文本', value: 'text' },
    { label: '坐标获取', value: 'point' },
    { label: '开始循环', value: 'sLoop' },
    { label: '结束循环', value: 'eLoop' },
    { label: '刷新页面', value: 'reload' },
  ]);
  const [pressTypes] = useState(['持续按着', '按一下', '释放按键']);
  const [mouseTypes] = useState(['移动鼠标', '持续按着', '按一下', '释放鼠标']);
  const [list, setList] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loopTimes, setLoopTimes] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLogVisible, setIsLogVisible] = useState(false);

  const changeVal = (val: string, id: string, prop: string) => {
    list.forEach((item: any) => {
      if (item.id === id) {
        item[prop] = val;
      }
    });
    const newArr = [...list];
    setList(newArr);
  };

  const changeInput = (e: any, id: string, prop: string) => {
    const val = e.target.value;
    changeVal(val, id, prop);
  };

  const changeInputNumber = (val: string, id: string, prop: string) => {
    changeVal(val, id, prop);
  };

  const changeSelect = (val: string, id: string, prop = 'type') => {
    list.forEach((item: any) => {
      if (item.id === id) {
        item[prop] = val;
      }
    });
    const newArr = [...list];
    setList(newArr);
  };

  const handleStart = () => {
    ipcRenderer.crawler({ times: loopTimes, list });
    setIsLogVisible(true);
    localStorage.setItem('list', JSON.stringify(list));
    localStorage.setItem('loopTimes', loopTimes.toString());
  };

  const handleAdd = () => {
    const lastSort = list.length;
    list.push({
      id: new Date().getTime().toString(),
      type: 'jump',
      target: '',
      value: '',
      value1: 'text',
      value2: '',
      sort: lastSort,
    });
    const newArr = [...list];
    setList(newArr);
  };

  const handleDelete = (id: string) => {
    const newList = list.filter((v: { id: string }) => v.id !== id);
    newList.forEach((item: any, index) => {
      item.sort = index;
    });
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
    const isVisible = !isLogVisible;
    setIsLogVisible(isVisible);
  };

  const changeTimes = (val: number) => {
    setLoopTimes(val);
  };

  const compare = (key: string) => {
    return (obj1: any, obj2: any) => {
      if (obj1[key] < obj2[key]) {
        return -1;
      }
      if (obj1[key] > obj2[key]) {
        return 1;
      }
      return 0;
    };
  };

  const dragStart = (e: any, sort: number, id: string) => {
    e.dataTransfer.setData('sort', sort);
    e.dataTransfer.setData('id', id);
  };

  const dragOver = (e: any) => {
    e.preventDefault();
  };

  const drop = (e: any, droppedSort: number, data: []) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('id');
    const sort = e.dataTransfer.getData('sort');
    if (sort < droppedSort) {
      data.map((item: any) => {
        if (item.id === id) {
          item.sort = droppedSort;
        } else if (item.sort > sort && item.sort < droppedSort + 1) {
          item.sort -= 1;
        }
        return item;
      });
    } else {
      data.map((item: any) => {
        if (item.id === id) {
          item.sort = droppedSort;
        } else if (item.sort > droppedSort - 1 && item.sort < sort) {
          item.sort += 1;
        }
        return item;
      });
    }
    const newArr = [...data];
    setList(newArr);
  };

  useEffect(() => {
    const times = localStorage.getItem('loopTimes');
    setLoopTimes(Number(times));
    const str = localStorage.getItem('list');
    if (str) {
      setList(JSON.parse(str));
    }
    ipcRenderer.on('crawler', (arg: any) => {
      let newLogs = [];
      logs.unshift(arg);
      newLogs = logs.filter(
        (item: any, index, self) =>
          self.findIndex((el: { id: string }) => el.id === item.id) === index
      );
      setLogs(newLogs);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page-wrap">
      <div className="operate-box">
        <div className="operate-item">
          <Button type="primary" onClick={handleAdd}>
            新增步骤
          </Button>
          {Boolean(list.length) && (
            <>
              <div className="input-time">
                <span>循环次数</span>
                <InputNumber
                  className="num-item"
                  onChange={(e) => changeTimes(e)}
                  value={loopTimes}
                />
              </div>
              <Button type="primary" danger onClick={handleStart}>
                执行
              </Button>
            </>
          )}
        </div>
        <div className="operate-right">
          <Tooltip title="点击查看如何获取选择器">
            <InfoCircleOutlined
              className="info-btn"
              style={{ color: '#1890ff' }}
              onClick={() => {
                setIsModalVisible(true);
              }}
            />
          </Tooltip>
          <Button
            onClick={() => {
              toggleLogVisible();
            }}
          >
            {isLogVisible ? '关闭' : '打开'}日志
          </Button>
        </div>
      </div>
      <div className="step-wrap">
        {list.sort(compare('sort')).map((item) => {
          return (
            <div
              className="step-item"
              key={item.id}
              draggable
              onDragStart={(e) => dragStart(e, item.sort, item.id)}
              onDragOver={(e) => dragOver(e)}
              onDrop={(e) => drop(e, item.sort, list)}
            >
              <Tooltip title="删除">
                <DeleteOutlined
                  style={{ color: 'red' }}
                  className="del-btn"
                  onClick={() => handleDelete(item.id)}
                />
              </Tooltip>
              <Select
                className="select-main"
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
              <div className="step-box">
                {['jump'].includes(item.type) && (
                  <Input
                    className="input-item"
                    value={item.target}
                    onChange={(e) => changeInput(e, item.id, 'target')}
                    placeholder="请输入网址"
                  />
                )}
                {['screenshot'].includes(item.type) && (
                  <Input
                    className="input-item"
                    value={item.target}
                    onChange={(e) => changeInput(e, item.id, 'target')}
                    placeholder="请输入存放文件的路径"
                  />
                )}
                {[
                  'click',
                  'dblclick',
                  'input',
                  'exist',
                  'image',
                  'text',
                ].includes(item.type) && (
                  <>
                    <Input
                      className="input-item"
                      value={item.target}
                      onChange={(e) => changeInput(e, item.id, 'target')}
                      placeholder="请输入选择器"
                    />
                  </>
                )}
                {['image', 'text'].includes(item.type) && (
                  <Input
                    className="input-item"
                    value={item.value}
                    onChange={(e) => changeInput(e, item.id, 'value')}
                    placeholder="请输入存放文件的路径"
                  />
                )}
                {['text'].includes(item.type) && (
                  <Input
                    style={{ marginTop: '10px' }}
                    className="input-item"
                    value={item.value2}
                    onChange={(e) => changeInput(e, item.id, 'value2')}
                    placeholder="请输入文件名"
                  />
                )}
                {['image'].includes(item.type) && (
                  <Input
                    style={{ marginTop: '10px' }}
                    className="input-item"
                    value={item.value2}
                    onChange={(e) => changeInput(e, item.id, 'value2')}
                    placeholder="请输入名称所在的选择器"
                  />
                )}
                {['js'].includes(item.type) && (
                  <Input
                    className="input-item"
                    value={item.value}
                    onChange={(e) => changeInput(e, item.id, 'value')}
                    placeholder="请填写值"
                  />
                )}
                {['input'].includes(item.type) && (
                  <Input.Group compact className="input-item">
                    <Select
                      defaultValue="text"
                      onChange={(e) => changeSelect(e, item.id, 'value1')}
                    >
                      <Option value="text">文本</Option>
                      <Option value="password">密码</Option>
                    </Select>
                    <Input
                      style={{ width: '60%' }}
                      value={item.value}
                      type={item.value1}
                      onChange={(e) => changeInput(e, item.id, 'value')}
                      placeholder="请填写值"
                    />
                  </Input.Group>
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
                {['sLoop'].includes(item.type) && (
                  <InputNumber
                    className="input-item"
                    value={item.value}
                    onChange={(e) => changeInputNumber(e, item.id, 'value')}
                    placeholder="请填写次数"
                    addonAfter="次"
                  />
                )}
                {['keyboard'].includes(item.type) && (
                  <>
                    <Select
                      className="select-item"
                      showSearch
                      placeholder="选择方式"
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
                {['mouse'].includes(item.type) && (
                  <>
                    <Select
                      className="select-item"
                      showSearch
                      placeholder="选择方式"
                      optionFilterProp="children"
                      value={item.target}
                      onChange={(e) => changeSelect(e, item.id, 'target')}
                      filterOption={(input, option) =>
                        option.children
                          .toLowerCase()
                          .indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      {mouseTypes.map((k) => (
                        <Option value={k} key={k}>
                          {k}
                        </Option>
                      ))}
                    </Select>
                    <Input
                      className="input-item"
                      value={item.value}
                      onChange={(e) => changeInput(e, item.id, 'value')}
                      placeholder="请填写坐标,格式: 100,200"
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Modal
        title="获取选择器"
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
