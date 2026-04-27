import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

export default function Home() {
  return (
    <Layout
      title="Digital Church Team"
      description="Digital Church Team homepage"
      noNavbar
      noFooter>
      <main className={styles.homepage}>
        <Heading as="h1" className={styles.title}>
          Digital Church Team
        </Heading>
      </main>
    </Layout>
  );
}
