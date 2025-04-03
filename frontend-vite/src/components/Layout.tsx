import { useState } from "react"; // Adiciona o import do useState
import "./Layout.css";

const sidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: "/images/Home.svg" },
  { id: "products", label: "Produtos", icon: "/images/Spinner.svg" },
  { id: "messages", label: "Mensagens", icon: "/images/Mail.svg" },
  { id: "settings", label: "Configurações", icon: "/images/Setting.svg" },
  { id: "help", label: "Help Centre", icon: "/images/Help.svg" },
];

const footerItem = { id: "logout", label: "Sair", icon: "/images/Arrow Left.svg" };

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="principal">
      <input
        id="nav-toggle"
        type="checkbox"
        checked={sidebarCollapsed}
        onChange={() => setSidebarCollapsed(!sidebarCollapsed)}
        style={{ display: "none" }}
      />

      <div className="sidebar">
        <div className="sidebar__header">
          <img
            className="sidebar__logo-icon"
            alt="Logo"
            src={sidebarCollapsed ? "/images/b-cercas.png" : "/images/belgo-cercas.png"}
          />
          <hr />
          <label htmlFor="nav-toggle" className="sidebar__collapse-button">
            <img
              className="arrow-left-icon"
              alt="Toggle"
              src={sidebarCollapsed ? "/images/Arrow Right.svg" : "/images/Arrow Left.svg"}
            />
          </label>
        </div>
        <div className="sidebar__navbar">
          <div className="sidebar__wrapper">
            <div className="sidebar__nav-item">
              <img className="home-icon" alt="sidebar__nav-title" src="/images/Home.svg" />
              <span className="sidebar__nav-title">Dashboard</span>
            </div>
            <div className="sidebar__nav-item">
              <img className="home-icon" alt="Produtos" src="/images/Spinner.svg" />
              <span className="sidebar__nav-title">Produtos</span>
            </div>
          </div>
          <div className="col">
            <div className="sidebar__wrapper">
              <div className="sidebar__nav-item">
                <img className="home-icon" alt="Mensagens" src="/images/Mail.svg" />
                <span className="sidebar__nav-title">Mensagens</span>
              </div>
              <div className="sidebar__nav-item">
                <img className="home-icon" alt="Configurações" src="/images/Setting.svg" />
                <span className="sidebar__nav-title">Configurações</span>
              </div>
              <div className="sidebar__nav-item">
                <img className="home-icon" alt="Help" src="/images/Help.svg" />
                <span className="sidebar__nav-title">Help centre</span>
              </div>
            </div>
          </div>
        </div>
        <div className="sidebar__footer">
          <div className="sidebar__nav-item5">
            <img className="home-icon" alt="Sair" src="/images/Arrow Left.svg" />
            <span className="sidebar__nav-title">Sair</span>
          </div>
        </div>
      </div>

      <div className="main">
        <div className="page-header">
          <div className="page-header__notification">
            <img className="page-header__bell-icon" alt="Notificações" src="/images/Bell.svg" />
            <div className="page-header__bullet" />
          </div>
          <div className="page-header__profile">
            <img
              className="page-header__profile-child"
              alt="Avatar"
              src="/images/Rectangle 1.png"
            />
            <span className="page-header__user">Luciana</span>
            <img className="page-header__home-icon" alt="Dropdown" src="/images/Chevron Down.svg" />
          </div>
        </div>
        <div className="body">
          <div className="header">
            <p className="header__title">Produtos</p>
            <div className="header__crumbs">
              <div className="header__crumbs-item">
                <span className="header__link">Dashboard</span>
              </div>
              <div className="header__crumb-separator">
                <span className="header__link">/</span>
              </div>
              <div className="header__crumbs-item1">
                <span className="header__link">Produtos</span>
              </div>
            </div>
          </div>
          <div className="dinamico">
            {children} {/* Aqui entra o conteúdo variável */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
