import { useState } from 'react'
const { ipcRenderer } = window.electron
import './index.css'

export default function Index () {
  const [typeList] = useState([
    { label: '跳转', value: 'jump' },
    { label: '单击', value: 'click' },
    { label: '双击', value: 'dbclick' },
    { label: '输入', value: 'input' }
  ])
  let [list, setList] = useState([])

  const changeInput = (e, id, prop) => {
    const val = e.target.value
    list.forEach(item => {
      if (item.id === id) {
        item[prop] = val
      }
    })
    const newArr = [...list]
    setList(newArr)
  }

  const changeSelect = (e, id) => {
    const val = e.target.value
    list.forEach(item => {
      if (item.id === id) {
        item.type = val
        if (val !== 'input') {
          item.value = ''
        }
      }
    })
    const newArr = [...list]
    setList(newArr)
  }

  const handleStart = () => {
    console.log(list)
    ipcRenderer.crawler(list)
  }

  const handleAdd = () => {
    list.push({
      id: new Date().getTime().toString(),
      type: 'jump',
      target: '',
      value: ''
    })
    const newArr = [...list]
    setList(newArr)
  }

  const handleDelete = id => {
    setList(list.filter(v => v.id !== id))
  }

  return (
    <div>
      <button onClick={handleAdd}>新增步骤</button>
      <div className='step-wrap'>
        {list.map(item => {
          return (
            <div className='step-item' key={item.id}>
              <select onChange={e => changeSelect(e, item.id)}>
                {typeList.map(item => {
                  return (
                    <option value={item.value} key={item.value}>
                      {item.label}
                    </option>
                  )
                })}
              </select>
              <input
                value={item.target}
                onChange={e => changeInput(e, item.id, 'target')}
                placeholder='请输入目标'
              />
              {item.type === 'input' && (
                <input
                  value={item.value}
                  onChange={e => changeInput(e, item.id, 'value')}
                  placeholder='请输入填写的文本'
                />
              )}
              <button onClick={() => handleDelete(item.id)}>删除</button>
            </div>
          )
        })}
      </div>
      {Boolean(list.length) && <button onClick={handleStart}>执行</button>}
    </div>
  )
}
