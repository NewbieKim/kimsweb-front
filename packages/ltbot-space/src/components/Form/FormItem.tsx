import React from 'react'
function FormItem(props) {
    // 包含子组件、组件参数、组件事件
    const { children, name, label, handleChange, value } = props
    const onChange = (value) => {
        handleChange(name, value)
    }
    return <div>
        <span>{label}"：</span>
        {/* 如果子组件是Input组件，则克隆子组件，并设置onChange和value */}
        {
            React.isValidElement(children) & children.type.displayName === 'input' 
            ? React.cloneElement(children,{onChange , value })
            : null
        }
    </div>
}
FormItem.displayName = 'formItem'
export default FormItem