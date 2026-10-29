import {
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Search,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { LinkButton } from '../../components/ui/Button';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { HeroVault, InteractiveDemo } from './VaultPreview';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import styles from './LandingPage.module.css';

const features = [
  {
    index: '01',
    Icon: LockKeyhole,
    title: 'Encrypted before storage',
    body: 'AES-256-GCM seals each password with a fresh nonce in your browser. The server stores ciphertext, never the plaintext password.',
    tag: 'AES-256-GCM',
  },
  {
    index: '02',
    Icon: Fingerprint,
    title: 'A key only you hold',
    body: 'Argon2id turns your master password into a key locally. The server receives a derived auth key — never the master password or encryption key.',
    tag: 'Argon2id',
  },
  {
    index: '03',
    Icon: Search,
    title: 'Focused by design',
    body: 'Service, login, password. Search the vault, reveal a secret only when needed, and copy it with one deliberate action.',
    tag: '3 fields',
  },
];

const flow = [
  {
    index: '01',
    title: 'Master password',
    body: 'Typed into this browser. It is never transmitted.',
    tag: 'browser',
    local: true,
  },
  {
    index: '02',
    title: 'Argon2id',
    body: '64 MiB · 4 passes · 2 lanes produce a 32-byte master key.',
    tag: 'browser',
    local: true,
  },
  {
    index: '03',
    title: 'HKDF-SHA256',
    body: 'The master key is split into a separate auth key and encryption key.',
    tag: 'browser',
    local: true,
  },
  {
    index: '04',
    title: 'Verifier',
    body: 'A SHA-256 verifier is stored. Sign-in sends the auth key, which the server hashes and compares.',
    tag: 'server',
    local: false,
  },
  {
    index: '05',
    title: 'AES-256-GCM',
    body: 'The encryption key seals passwords with a unique 96-bit nonce. Only ciphertext and nonce are stored.',
    tag: 'server',
    local: false,
  },
];

export function LandingPage() {
  useDocumentTitle('Alpine Passmanager — Passwords, kept in confidence.');

  return (
    <div className={styles.page}>
      <PublicHeader />

      <main id="main-content">
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Private by construction</p>
              <h1 className={styles.heroTitle}>
                Passwords,
                <br />
                kept in confidence.
              </h1>
              <p className={styles.heroLead}>
                A calm, private vault for the credentials that matter. Your
                password is encrypted in the browser before it ever reaches the
                server.
              </p>
              <div className={styles.heroActions}>
                <LinkButton to="/register" size="lg">
                  Create your vault
                </LinkButton>
                <LinkButton to="/login" variant="secondary" size="lg">
                  Sign in
                </LinkButton>
              </div>
              <p className={styles.heroNote}>
                <ShieldCheck size={14} aria-hidden="true" />
                Master password never sent
                <span className={styles.noteDot} aria-hidden="true" />
                Keys stay in memory
              </p>
            </div>

            <HeroVault />
          </div>
        </section>

        <section className={styles.section} id="product">
          <div className={styles.container}>
            <div className={styles.sectionIntro}>
              <div>
                <p className={styles.eyebrow}>The vault</p>
                <h2 className={styles.sectionTitle}>
                  Everything that matters.
                  <br />
                  Nothing that does not.
                </h2>
              </div>
              <p className={styles.sectionLead}>
                Search by service or login, open an entry, reveal or copy its
                password. The preview below is interactive and uses fictitious
                sample records only.
              </p>
            </div>

            <InteractiveDemo />

            <p className={styles.demoNote}>
              <LockKeyhole size={13} aria-hidden="true" />
              Sample entries are deliberately fake and the preview is not
              connected to a real vault.
            </p>
          </div>
        </section>

        <section className={styles.featureSection} aria-label="Product principles">
          <div className={styles.container}>
            <div className={styles.featureGrid}>
              {features.map(({ index, Icon, title, body, tag }) => (
                <article className={styles.feature} key={index}>
                  <div className={styles.featureTop}>
                    <span className={styles.featureIcon}>
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <span className={styles.featureIndex}>{index}</span>
                  </div>
                  <h3 className={styles.featureTitle}>{title}</h3>
                  <p className={styles.featureBody}>{body}</p>
                  <p className={styles.featureTag}>{tag}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.securitySection} id="security">
          <div className={styles.container}>
            <div className={styles.securityPanel}>
              <div className={styles.securityCopy}>
                <p className={styles.eyebrow}>Security model</p>
                <h2 className={styles.sectionTitle}>
                  Precise about what is protected.
                </h2>
                <p className={styles.securityLead}>
                  Alpine uses the existing protocol of this project: the master
                  password and encryption key remain in the browser. The server
                  stores encrypted passwords and a verifier used to
                  authenticate you.
                </p>

                <ul className={styles.securityFacts}>
                  <li>
                    <LockKeyhole size={17} aria-hidden="true" />
                    <div>
                      <strong>Only the password field is encrypted</strong>
                      <p>
                        Service names and logins are stored as plain text by the
                        current backend. This interface does not claim otherwise.
                      </p>
                    </div>
                  </li>
                  <li>
                    <TriangleAlert size={17} aria-hidden="true" />
                    <div>
                      <strong>There is no password recovery</strong>
                      <p>
                        The backend has no reset flow. If the master password is
                        lost, the vault cannot be reopened.
                      </p>
                    </div>
                  </li>
                  <li>
                    <KeyRound size={17} aria-hidden="true" />
                    <div>
                      <strong>A verifier can be guessed offline</strong>
                      <p>
                        The server holds the salt and a SHA-256 verifier derived
                        from your auth key. Use a strong, unique master password.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className={styles.flowPanel}>
                <div className={styles.flowHeader}>
                  <span>Data path</span>
                  <span className={styles.flowRoute}>browser → server</span>
                </div>

                <ol className={styles.flowList}>
                  {flow.map((step) => (
                    <li className={styles.flowStep} key={step.index}>
                      <span className={styles.flowIndex}>{step.index}</span>
                      <div className={styles.flowContent}>
                        <div className={styles.flowTitleRow}>
                          <strong>{step.title}</strong>
                          <span
                            className={
                              step.local ? styles.tagLocal : styles.tagServer
                            }
                          >
                            {step.tag}
                          </span>
                        </div>
                        <p>{step.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>

                <p className={styles.flowFootnote}>
                  This describes the current implementation, not immunity from
                  XSS, compromised devices or offline guessing. No client can
                  promise those things.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <div className={styles.ctaPanel}>
              <div className={styles.ctaWatermark} aria-hidden="true">
                <svg viewBox="0 0 200 120" fill="none">
                  <path
                    d="M6 108 64 8l36 67 18-31 76 64H6Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <circle cx="88" cy="85" r="5" fill="currentColor" />
                </svg>
              </div>
              <p className={styles.eyebrow}>Begin</p>
              <h2 className={styles.ctaTitle}>
                A quieter place for your passwords.
              </h2>
              <p className={styles.ctaLead}>
                Create a vault in a few thoughtful steps. One master password,
                one private workspace, no recovery backdoor.
              </p>
              <div className={styles.ctaActions}>
                <LinkButton to="/register" size="lg">
                  Create your vault
                </LinkButton>
                <LinkButton to="/login" variant="secondary" size="lg">
                  Sign in
                </LinkButton>
              </div>
              <p className={styles.ctaNote}>
                Keep your master password somewhere safe. It cannot be reset.
              </p>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
