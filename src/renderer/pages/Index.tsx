import { useState, useEffect, useRef } from 'react';
import './index.css';

const { ipcRenderer } = window.electron;

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

  const changeSelect = (e, id) => {
    const val = e.target.value;
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
      setTimeout(() => {
        logRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };

  useEffect(() => {
    const str = localStorage.getItem('list');
    if (str) {
      setList(JSON.parse(str));
    }
    ipcRenderer.on('crawler', (arg) => {
      const newLogs = [];
      logs.push(arg);
      console.log(logs);
      logs.forEach((item) => {
        if (item.id !== arg.id) {
          newLogs.push(item);
        }
      });
      setLogs(newLogs);
      scrollToBottom();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <button type="button" onClick={handleAdd}>
        新增步骤
      </button>
      <div className="step-wrap">
        {list.map((item) => {
          return (
            <div className="step-item" key={item.id}>
              <select
                value={item.type}
                onChange={(e) => changeSelect(e, item.id)}
              >
                {typeList.map((v) => {
                  return (
                    <option value={v.value} key={v.value}>
                      {v.label}
                    </option>
                  );
                })}
              </select>
              <input
                value={item.target}
                onChange={(e) => changeInput(e, item.id, 'target')}
                placeholder="请输入目标"
              />
              {item.type === 'input' && (
                <input
                  value={item.value}
                  onChange={(e) => changeInput(e, item.id, 'value')}
                  placeholder="请输入填写的文本"
                />
              )}
              <button type="button" onClick={() => handleDelete(item.id)}>
                删除
              </button>
            </div>
          );
        })}
      </div>
      {Boolean(list.length) && (
        <button type="button" onClick={handleStart}>
          执行
        </button>
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
    </div>
  );
}
