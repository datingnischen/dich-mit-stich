import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <p>Vercel-Migration gestartet</p>
          <h1>dich-mit-stich.de wird auf ein neues Headless-Frontend umgestellt.</h1>
          <p>
            Diese erste Projektbasis dient als sauberer Startpunkt für die schrittweise
            Migration von ICONY nach Next.js und Vercel. Als nächste Schritte folgen die
            Magazin-Anbindung, die Zielrouten und danach die visuelle Nachbildung der
            öffentlichen Startseite.
          </p>
        </div>

        <div className={styles.ctas}>
          <a className={styles.primary} href="https://dich-mit-stich.de" target="_blank" rel="noreferrer">
            Aktuelle Live-Seite ansehen
          </a>
          <a className={styles.secondary} href="https://dich-mit-stich.de/magazin/" target="_blank" rel="noreferrer">
            WordPress-Magazin prüfen
          </a>
        </div>
      </main>
    </div>
  );
}
