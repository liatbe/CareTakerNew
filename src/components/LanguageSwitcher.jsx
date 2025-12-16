import { useTranslation } from 'react-i18next'
import './LanguageSwitcher.css'

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className="language-switcher">
      <button
        className={`lang-button ${i18n.language === 'en' ? 'active' : ''}`}
        onClick={() => changeLanguage('en')}
      >
        English
      </button>
      <button
        className={`lang-button ${i18n.language === 'he' ? 'active' : ''}`}
        onClick={() => changeLanguage('he')}
      >
        עברית
      </button>
    </div>
  )
}

export default LanguageSwitcher

