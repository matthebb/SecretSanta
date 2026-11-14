const TITLE = 'Hebb/Young Secret Santa';
const PEOPLE = ['Matt', 'Sarah', 'Maddie', 'Morgan', 'Dash', 'Cohen', 'Eli'];
const EXCLUSIONS = {Matt:'Sarah', Sarah:'Matt', Maddie:'Morgan', Morgan:'Maddie'};
const DRAW_KEY = 'DRAW_2026';
const LINK_MINUTES = 20;
const DAY = 24 * 60 * 60 * 1000;

function doGet() {
  try {
    withLock_(ensureDraw_);
  } catch (error) {
    console.warn('Secret Santa setup could not be loaded.');
  }
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function requestSignIn(address) {
  const email = normalize_(address);
  const generic = {state:'check-inbox'};
  try {
    const pending = withLock_(properties => {
      const url = ScriptApp.getService().getUrl();
      if (properties.getProperty('EMAIL_ENABLED') !== 'true' || !url || !url.endsWith('/exec')) {
        return {state:'paused'};
      }
      const draw = ensureDraw_(properties);
      if (!draw) return {state:'paused'};
      const index = draw.findIndex(person => person.email === email);
      if (index < 0) return generic;
      const key = 'SIGNIN_2026_' + index;
      const now = Date.now();
      const state = JSON.parse(properties.getProperty(key) || '{"sent":[],"links":[]}');
      state.sent = state.sent.filter(time => time > now - DAY);
      state.links = state.links.filter(link => link.expires > now);
      if (state.sent.length >= 5 || state.sent.some(time => time > now - 60000)) return generic;

      const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
      const hash = hash_(token);
      state.sent.push(now);
      state.links.push({hash, expires:now + LINK_MINUTES * 60 * 1000});
      properties.setProperty(key, JSON.stringify(state));
      return {key, hash, now, email:draw[index].email, url:url + '#signin=' + token};
    });
    if (pending.state) return pending;

    try {
      MailApp.sendEmail({
        to:pending.email,
        name:TITLE,
        subject:'Your Hebb/Young Secret Santa sign-in link',
        body:'Open this link within ' + LINK_MINUTES + ' minutes, then select Reveal my assignment.\n\n' +
          pending.url + '\n\nIf you did not request this link, you can ignore this email.'
      });
    } catch (error) {
      withLock_(properties => {
        const state = JSON.parse(properties.getProperty(pending.key));
        state.links = state.links.filter(link => link.hash !== pending.hash);
        state.sent = state.sent.filter(time => time !== pending.now);
        properties.setProperty(pending.key, JSON.stringify(state));
      });
      return {state:'retry'};
    }
    return generic;
  } catch (error) {
    console.warn('Secret Santa sign-in request could not be completed.');
    return {state:'retry'};
  }
}

function revealAssignment(token) {
  const invalid = {state:'invalid'};
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return invalid;
  const hash = hash_(token);
  return withLock_(properties => {
    const saved = properties.getProperty(DRAW_KEY);
    if (!saved) return invalid;
    const draw = JSON.parse(saved);
    const now = Date.now();
    for (const [index, person] of draw.entries()) {
      const key = 'SIGNIN_2026_' + index;
      const state = JSON.parse(properties.getProperty(key) || 'null');
      if (!state) continue;
      const match = state.links.find(link => link.hash === hash && link.expires > now);
      if (!match) continue;
      state.links = state.links.filter(link => link.hash !== hash && link.expires > now);
      properties.setProperty(key, JSON.stringify(state));
      return {state:'revealed', giver:person.name, recipient:person.recipient};
    }
    return invalid;
  });
}

function ensureDraw_(properties) {
  const saved = properties.getProperty(DRAW_KEY);
  if (saved) return JSON.parse(saved);
  const input = properties.getProperty('ROSTER');
  if (!input) return null;
  const roster = JSON.parse(input);
  const addresses = PEOPLE.map(name => normalize_(roster[name]));
  if (new Set(addresses).size !== PEOPLE.length || addresses.some(email => !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email))) return null;
  let recipients;
  do {
    recipients = PEOPLE.slice();
    for (let i = recipients.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [recipients[i], recipients[j]] = [recipients[j], recipients[i]];
    }
  } while (PEOPLE.some((name, i) => name === recipients[i] || EXCLUSIONS[name] === recipients[i]));
  const draw = PEOPLE.map((name, i) => ({name, email:addresses[i], recipient:recipients[i]}));
  properties.setProperty(DRAW_KEY, JSON.stringify(draw));
  return draw;
}

function withLock_(work) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return work(PropertiesService.getScriptProperties());
  } finally {
    lock.releaseLock();
  }
}

function normalize_(address) {
  return typeof address === 'string' && address.length <= 254 ? address.trim().toLowerCase() : '';
}

function hash_(token) {
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token));
}
