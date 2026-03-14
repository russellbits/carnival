import '../src/app.css'

export const parameters = {
  backgrounds: { disable: true },
}

export const decorators = [
  (Story) => {
    document.documentElement.setAttribute('data-theme', 'zork')
    return Story()
  }
]
