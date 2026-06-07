// ===================================================
// Toast 通知组件
// ===================================================

let container = null;

function getContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * 显示Toast通知
 * @param {string} msg 消息
 * @param {'info'|'success'|'error'} type
 */
export function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  getContainer().appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
