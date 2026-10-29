import { Link, NavLink } from 'react-router-dom';
import { FolderLock, Lock, Plus, ShieldCheck } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import styles from './VaultPage.module.css';

interface SidebarProps {
  username: string;
  count: number | null;
  onNew: () => void;
  onLock: () => void;
}

function accountInitial(username: string) {
  return username.trim().charAt(0).toUpperCase() || 'A';
}

export function VaultSidebar({ username, count, onNew, onLock }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarBrand}>
        <Link to="/" aria-label="Alpine Passmanager home">
          <Logo />
        </Link>
      </div>

      <div className={styles.newButtonWrap}>
        <Button block leadingIcon={<Plus size={16} />} onClick={onNew}>
          New item
        </Button>
      </div>

      <nav className={styles.nav} aria-label="Vault navigation">
        <p className={styles.navLabel}>Vault</p>
        <NavLink
          to="/vault"
          className={({ isActive }) =>
            [styles.navItem, isActive ? styles.navActive : '']
              .filter(Boolean)
              .join(' ')
          }
        >
          <FolderLock size={16} aria-hidden="true" />
          <span>All items</span>
          {count !== null ? <span className={styles.navCount}>{count}</span> : null}
        </NavLink>
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.account}>
          <span className={styles.accountAvatar} aria-hidden="true">
            {accountInitial(username)}
          </span>
          <span className={styles.accountText}>
            <span className={styles.accountName}>{username}</span>
            <span className={styles.accountStatus}>Private session</span>
          </span>
          <IconButton
            label="Lock vault"
            icon={<Lock size={15} />}
            size="sm"
            onClick={onLock}
          />
        </div>
        <p className={styles.sidebarNote}>
          <ShieldCheck size={12} aria-hidden="true" />
          Keys stay in this tab
        </p>
      </div>
    </aside>
  );
}

interface MobileHeaderProps {
  onNew: () => void;
  onLock: () => void;
}

export function MobileVaultHeader({ onNew, onLock }: MobileHeaderProps) {
  return (
    <header className={styles.mobileHeader}>
      <Link
        to="/"
        aria-label="Alpine Passmanager home"
        className={styles.mobileBrand}
      >
        <Logo size="sm" nameClassName={styles.mobileLogoName} />
      </Link>
      <div className={styles.mobileActions}>
        <Button size="sm" leadingIcon={<Plus size={15} />} onClick={onNew}>
          New
        </Button>
        <IconButton
          label="Lock vault"
          icon={<Lock size={16} />}
          onClick={onLock}
        />
      </div>
    </header>
  );
}
