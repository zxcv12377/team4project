// src/extensions/CustomPlaceholder.js
// 에디터가 실제 내용 없이 비어 있을 때만 placeholder 문구를 보여주도록 하는 확장 기능
// 빈 상태가 플레이스 홀더 문구 가 나타나면 , 텍스트를 입력하면 기능을 제공
import Placeholder from '@tiptap/extension-placeholder'

const CustomPlaceholder = Placeholder.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      emptyEditorClass: 'is-editor-empty',
      placeholder: '내용을 입력하세요.',
      showOnlyWhenEditable: true,
      showOnlyCurrent: false,
    }
  },


  //에디터의 내부 내용을 JSON으로 가져와 비어있는 경우를 직접 정의  
  // 공백만 있을 경우도 "비어있지 않다"로 판단하지 않게 함
  isEmpty({ editor }) {
    const json = editor.getJSON()

    return (
      json.content?.length === 1 &&
      json.content[0].type === 'paragraph' &&
      !json.content[0].content
    )
  },
})


export default CustomPlaceholder