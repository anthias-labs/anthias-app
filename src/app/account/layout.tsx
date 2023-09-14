import styles from "./layout.module.scss";

export default async function AccountLayout({ children }) {
  return <div className={styles.account}>{children}</div>;
}
