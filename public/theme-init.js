try {
  var t = localStorage.getItem('cl_theme')
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t
  var dark = t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.querySelector('meta[name=theme-color]').content = dark ? '#1e1913' : '#f4ecdb'
} catch (e) {}
