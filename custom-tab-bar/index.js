Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: '/pages/index/index',
        text: '首页',
        iconPath: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48cGF0aCBkPSJNOCAyMEwyNCA2bDE2IDE0djIwSDMwVjI4SDE4djEySDh6IiBmaWxsPSJub25lIiBzdHJva2U9IiM3YzZmNjQiIHN0cm9rZS13aWR0aD0iMi41IiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+',
        selectedIconPath: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48cGF0aCBkPSJNOCAyMEwyNCA2bDE2IDE0djIwSDMwVjI4SDE4djEySDh6IiBmaWxsPSIjOGIzYTFhIiBzdHJva2U9IiM4YjNhMWEiIHN0cm9rZS13aWR0aD0iMi41IiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+'
      },
      {
        pagePath: '/pages/guide/guide',
        text: '导览',
        iconPath: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48Y2lyY2xlIGN4PSIyNCIgY3k9IjE2IiByPSI3IiBmaWxsPSJub25lIiBzdHJva2U9IiM3YzZmNjQiIHN0cm9rZS13aWR0aD0iMi41Ii8+PHBhdGggZD0iTTE0IDQ0YzAtNi42IDQuNS0xMiAxMC0xMnMxMCA1LjQgMTAgMTIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzdjNmY2NCIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxjaXJjbGUgY3g9IjI0IiBjeT0iMTkiIHI9IjIiIGZpbGw9IiM3YzZmNjQiLz48L3N2Zz4=',
        selectedIconPath: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48Y2lyY2xlIGN4PSIyNCIgY3k9IjE2IiByPSI3IiBmaWxsPSJub25lIiBzdHJva2U9IiM4YjNhMWEiIHN0cm9rZS13aWR0aD0iMi41Ii8+PHBhdGggZD0iTTE0IDQ0YzAtNi42IDQuNS0xMiAxMC0xMnMxMCA1LjQgMTAgMTIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzhiM2ExYSIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxjaXJjbGUgY3g9IjI0IiBjeT0iMTkiIHI9IjIiIGZpbGw9IiM4YjNhMWEiLz48L3N2Zz4='
      },
      {
        pagePath: '/pages/culture/culture',
        text: '文化',
        iconPath: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48cGF0aCBkPSJNMTAgOGgxMnYzMkgxMGE0IDQgMCAwMS00LTRWMTJhNCA0IDAgMDE0LTR6IiBmaWxsPSJub25lIiBzdHJva2U9IiM3YzZmNjQiIHN0cm9rZS13aWR0aD0iMi41Ii8+PHBhdGggZD0iTTIyIDhoMTJhNCA0IDAgMDE0IDR2MjRhNCA0IDAgMDEtNCA0SDIyIiBmaWxsPSJub25lIiBzdHJva2U9IiM3YzZmNjQiIHN0cm9rZS13aWR0aD0iMi41Ii8+PGxpbmUgeDE9IjE1IiB5MT0iMTYiIHgyPSIxOSIgeTI9IjE2IiBzdHJva2U9IiM3YzZmNjQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PGxpbmUgeDE9IjE1IiB5MT0iMjIiIHgyPSIxOSIgeTI9IjIyIiBzdHJva2U9IiM3YzZmNjQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PGxpbmUgeDE9IjE1IiB5MT0iMjgiIHgyPSIxOSIgeTI9IjI4IiBzdHJva2U9IiM3YzZmNjQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
        selectedIconPath: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48cGF0aCBkPSJNMTAgOGgxMnYzMkgxMGE0IDQgMCAwMS00LTRWMTJhNCA0IDAgMDE0LTR6IiBmaWxsPSJub25lIiBzdHJva2U9IiM4YjNhMWEiIHN0cm9rZS13aWR0aD0iMi41Ii8+PHBhdGggZD0iTTIyIDhoMTJhNCA0IDAgMDE0IDR2MjRhNCA0IDAgMDEtNCA0SDIyIiBmaWxsPSJub25lIiBzdHJva2U9IiM4YjNhMWEiIHN0cm9rZS13aWR0aD0iMi41Ii8+PGxpbmUgeDE9IjE1IiB5MT0iMTYiIHgyPSIxOSIgeTI9IjE2IiBzdHJva2U9IiM4YjNhMWEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PGxpbmUgeDE9IjE1IiB5MT0iMjIiIHgyPSIxOSIgeTI9IjIyIiBzdHJva2U9IiM4YjNhMWEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PGxpbmUgeDE9IjE1IiB5MT0iMjgiIHgyPSIxOSIgeTI9IjI4IiBzdHJva2U9IiM4YjNhMWEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+'
      },
      {
        pagePath: '/pages/specialty/specialty',
        text: '风物',
        iconPath: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48cGF0aCBkPSJNMTYgNDBWMjJhOCA4IDAgMTExNiAwdjE4IiBmaWxsPSJub25lIiBzdHJva2U9IiM3YzZmNjQiIHN0cm9rZS13aWR0aD0iMi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNMTQgMjJoNE0zMCAyMmg0IiBzdHJva2U9IiM3YzZmNjQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHJlY3QgeD0iMTIiIHk9IjM2IiB3aWR0aD0iMjQiIGhlaWdodD0iNCIgcng9IjIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzdjNmY2NCIgc3Ryb2tlLXdpZHRoPSIyIi8+PGVsbGlwc2UgY3g9IjI0IiBjeT0iMTgiIHJ4PSIxMCIgcnk9IjMiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzdjNmY2NCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1kYXNoYXJyYXk9IjMgMyIvPjwvc3ZnPg==',
        selectedIconPath: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48cGF0aCBkPSJNMTYgNDBWMjJhOCA4IDAgMTExNiAwdjE4IiBmaWxsPSJub25lIiBzdHJva2U9IiM4YjNhMWEiIHN0cm9rZS13aWR0aD0iMi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNMTQgMjJoNE0zMCAyMmg0IiBzdHJva2U9IiM4YjNhMWEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHJlY3QgeD0iMTIiIHk9IjM2IiB3aWR0aD0iMjQiIGhlaWdodD0iNCIgcng9IjIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzhiM2ExYSIgc3Ryb2tlLXdpZHRoPSIyIi8+PGVsbGlwc2UgY3g9IjI0IiBjeT0iMTgiIHJ4PSIxMCIgcnk9IjMiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzhiM2ExYSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1kYXNoYXJyYXk9IjMgMyIvPjwvc3ZnPg=='
      },
      {
        pagePath: '/pages/profile/profile',
        text: '我的',
        iconPath: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48Y2lyY2xlIGN4PSIyNCIgY3k9IjE2IiByPSI5IiBmaWxsPSJub25lIiBzdHJva2U9IiM3YzZmNjQiIHN0cm9rZS13aWR0aD0iMi41Ii8+PHBhdGggZD0iTTggNDJjMC05LjQgNy4yLTE3IDE2LTE3czE2IDcuNiAxNiAxNyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjN2M2ZjY0IiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
        selectedIconPath: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48Y2lyY2xlIGN4PSIyNCIgY3k9IjE2IiByPSI5IiBmaWxsPSJub25lIiBzdHJva2U9IiM4YjNhMWEiIHN0cm9rZS13aWR0aD0iMi41Ii8+PHBhdGggZD0iTTggNDJjMC05LjQgNy4yLTE3IDE2LTE3czE2IDcuNiAxNiAxNyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOGIzYTFhIiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+'
      }
    ]
  },

  methods: {
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset;
      if (this.data.selected === index) return;
      this.setData({ selected: index });
      wx.switchTab({
        url: path,
        fail: () => {
          wx.showToast({ title: '页面切换失败，请重试', icon: 'none' });
          console.warn('[导航] tabBar 切换失败:', path);
        }
      });
    }
  }
});
