import { useState } from "react"; // Adiciona o import do useState
import "./Layout.css";

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
          <div className="wrapper">
            <div className="sidebar__nav-item">
              <img className="home-icon" alt="Dashboard" src="/images/Home.svg" />
              <span className="dashboard">Dashboard</span>
            </div>
            <div className="sidebar__nav-item">
              <img className="home-icon" alt="Produtos" src="/images/Spinner.svg" />
              <span className="dashboard">Produtos</span>
            </div>
          </div>
          <div className="col">
            <div className="wrapper">
              <div className="sidebar__nav-item">
                <img className="home-icon" alt="Mensagens" src="/images/Mail.svg" />
                <span className="dashboard">Mensagens</span>
              </div>
              <div className="sidebar__nav-item">
                <img className="home-icon" alt="Configurações" src="/images/Setting.svg" />
                <span className="dashboard">Configurações</span>
              </div>
              <div className="sidebar__nav-item">
                <img className="home-icon" alt="Help" src="/images/Help.svg" />
                <span className="dashboard">Help centre</span>
              </div>
            </div>
          </div>
        </div>
        <div className="navbar1">
          <div className="sidebar__nav-item5">
            <img className="home-icon" alt="Sair" src="/images/Arrow Left.svg" />
            <span className="dashboard">Sair</span>
          </div>
        </div>
      </div>

      <div className="main">
        <div className="page-header">
          <div className="notification">
            <img className="bell-icon" alt="Notificações" src="/images/Bell.svg" />
            <div className="bullet" />
          </div>
          <div className="profile">
            <img className="profile-child" alt="Avatar" src="/images/Rectangle 1.png" />
            <span className="luciana">Luciana</span>
            <img className="home-icon" alt="Dropdown" src="/images/Chevron Down.svg" />
          </div>
        </div>
        <div className="dinamico">
          {children} {/* Aqui entra o conteúdo variável */}
        </div>
      </div>
    </div>
  );
};

export default Layout;
