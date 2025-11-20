import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import styles from "./ErrorPage.module.css";

export default function ErrorPage() {
  const navigate = useNavigate();
  return (
    <Layout user={null}>
      <div className={styles.settingsContainer}>
        <div className={styles.settingsCard}>
          <div className={styles.header}>
            <h1 className={styles.title}>Something went wrong</h1>
            <p className={styles.subtitle}>
              An unexpected error occurred. Please try again later.
            </p>
          </div>

          <div className={styles.formRow}>
            <button
              type="button"
              className={styles.submitButton}
              onClick={() => navigate(-1)}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
