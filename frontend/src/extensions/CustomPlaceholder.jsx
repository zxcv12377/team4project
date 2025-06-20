// src/extensions/CustomPlaceholder.js
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