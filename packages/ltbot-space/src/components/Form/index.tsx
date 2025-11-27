import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom';

class Form extends React.Component{
    state = {
        formData: {}
    }
    submitForm = cb => {
        cb({ ...this.state.formData })
    }
    resetForm = () => {
        const { formData } = this.state
        Object.keys(formData).forEach((item) => {
            formData[item] = ''
        })
        this.setState({formData}) // setState重置formData
    }
    // 设置表单数据
    setValue = (name, value) => {
        this.setState({
            formData: {...this.state.formData, [name]: value}
        })
    }
    render() {
        // this.props中包含children, children是FormItem组件
        console.log('this.props', this.props)
        const { children } = this.props
        const renderChildren = []
        React.Children.forEach(children, (child) => {
            if (child.type.displayName==='formItem') {
                const { name } = child.props
                // clone
                // cloneElement方法用于创建一个新组件，并将其props设置为新的props，参数说明
                // 新组件的props包括：
                // key: name,
                // handleChange: this.setValue, // handleChange值发生改变 即setValue设置值
                // value: this.state.formData[name] || ''
                // 新组件的children为child.props.children, 即FormItem组件的子组件
                const Children = React.cloneElement(child, {
                    key: name,
                    handleChange: this.setValue, // handleChange值发生改变 即setValue设置值
                    value: this.state.formData[name] || ''
                }, child.props.children)
                renderChildren.push(Children)
            }
        })
        return renderChildren
    }
}
Form.displayName = 'form'
export default Form