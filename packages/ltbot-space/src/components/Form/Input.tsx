/* Input 组件, 负责回传value值 */
function Input({ onChange , value }){
    return  <input className="input"  onChange={ (e)=>( onChange && onChange(e.target.value) ) } value={value}  />
}
/* 给Component 增加标签 */
Input.displayName = 'input'
export default Input