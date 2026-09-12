(() => {
  if (window.__CHI_BIAN_YING_KEYBOARD_SIMPLE__) return;
  window.__CHI_BIAN_YING_KEYBOARD_SIMPLE__ = true;

  const style=document.createElement('style');
  style.id='keyboardSimpleStyle';
  style.textContent=`
    @media(max-width:700px){
      html.ui-v5 body.ui-final input,
      html.ui-v5 body.ui-final textarea,
      html.ui-v5 body.ui-final select{
        font-size:16px!important;
      }
    }
  `;
  document.head.appendChild(style);
})();