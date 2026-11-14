import {
  formatNumber,
  useIsTouch,
  useKitMessages,
  useLang,
  useMessages,
  type RulesSection,
} from './arcade';
import { MergeDiagram } from './components/MergeDiagram';
import { MESSAGES } from './i18n';
import { SCORING_EXAMPLES, TARGET_VALUE } from './logic/constants';

const isIos = () => typeof navigator !== 'undefined' && /iP(hone|od)/.test(navigator.userAgent);

/** The rules of 2048 as kit sections (goal, play, rules, scoring, dental, mobile). */
export function useRulesSections(): RulesSection[] {
  const t = useMessages(MESSAGES);
  const k = useKitMessages();
  const [lang] = useLang();
  const touch = useIsTouch();
  const num = (n: number) => formatNumber(n, lang);
  const target = num(TARGET_VALUE);

  return [
    { id: 'goal', body: <p>{t('rulesGoalBody', { target })}</p> },
    { id: 'play', body: <p>{touch ? t('rulesPlayTouch') : t('rulesPlayKeys')}</p> },
    {
      id: 'rules',
      body: (
        <>
          <MergeDiagram />
          <ul>
            <li>{t('rulesRule1')}</li>
            <li>{t('rulesRule2')}</li>
            <li>{t('rulesRule3')}</li>
            <li>{t('rulesRule4')}</li>
            <li>{t('rulesRule5')}</li>
          </ul>
        </>
      ),
    },
    {
      id: 'scoring',
      body: (
        <>
          <p>{t('rulesScoringBody')}</p>
          <ul>
            {SCORING_EXAMPLES.map((value) => (
              <li key={value}>{t('rulesMerge', { a: num(value), b: num(value * 2) })}</li>
            ))}
          </ul>
        </>
      ),
    },
    { id: 'dental', body: <p>{t('rulesDental', { target })}</p> },
    {
      id: 'mobile',
      body: (
        <>
          <ul>
            <li>{t('rulesMobileSwipe')}</li>
            <li>{t('rulesMobileButtons')}</li>
            <li>{t('rulesMobileFullscreen')}</li>
          </ul>
          {isIos() && <p>{k('iosHomeScreenTip')}</p>}
        </>
      ),
    },
  ];
}
