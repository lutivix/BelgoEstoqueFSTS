import React, { createContext } from "react";
import { useState, useEffect, useContext, useRef } from "react"; // Adiciona o import do useState
import "../Styles/Layout.css";
import { Link } from "react-router-dom";
import * as faIcons from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Contexto para armazenar a largura
const LayoutWidthContext = createContext<number>(0);
const LayoutHeightContext = createContext<number>(0);

export const useLayoutWidth = () => useContext(LayoutWidthContext); // Hook para acessar o contexto
export const useLayoutHeigth = () => useContext(LayoutHeightContext); // Hook para acessar o contexto

const mainSidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: faIcons.faHouse },
  { id: "products", label: "Produtos", icon: faIcons.faBoxesStacked },
];

const secondarySidebarItems = [
  { id: "reports", label: "Relatórios", icon: faIcons.faFileAlt },
  { id: "settings", label: "Configurações", icon: faIcons.faCog },
  { id: "help", label: "Help Centre", icon: faIcons.faQuestionCircle },
];

const footerItem = { id: "logout", label: "Sair", icon: "/images/Arrow Left.svg" };

const breadcrumbMap: Record<string, string> = {
  "/": "Dashboard",
  "/products": "Produtos",
  "/reports": "Relatórios",
  "/settings": "Configurações",
  "/help": "Suporte",
  // Adicione mais rotas aqui se precisar (ex.: "/messages": "Mensagens")
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  // Inicializar sidebarCollapsed com o valor do localStorage, se disponível
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 768);

  // Salvar sidebarCollapsed no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split("/").filter((x) => x);
    const crumbs = [{ path: "/", label: "Dashboard" }]; // Sempre começa com Dashboard
    if (pathnames.length > 0) {
      const fullPath = `/${pathnames[0]}`;
      if (breadcrumbMap[fullPath]) {
        crumbs.push({ path: fullPath, label: breadcrumbMap[fullPath] });
      }
    }
    return crumbs;
  };

  useEffect(() => {
    // Tipagem explícita
    const toggleSidebar = document.querySelector<HTMLInputElement>("#nav-toggle");
    const mobileToggle = document.querySelector<HTMLInputElement>("#mobile-sidebar-toggle");
    const collapseToggle = document.querySelector<HTMLInputElement>("#collapse-toggle");
    let inactivityTimer: number | undefined;

    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 768);
      if (toggleSidebar && mobileToggle) {
        // Respeitar o estado salvo do sidebarCollapsed, se disponível
        const savedCollapsed = JSON.parse(localStorage.getItem("sidebarCollapsed") || "false");
        if (window.innerWidth <= 1024 && window.innerWidth > 768) {
          toggleSidebar.checked = true; // Encolhe no tablet
          setSidebarCollapsed(true);
          console.log("Encolhendo sidebar (tablet)");
        } else {
          toggleSidebar.checked = false; // Expande para desktop
          setSidebarCollapsed(false);
          mobileToggle.checked = false;
          console.log("Expandindo sidebar (desktop/mobile)");
        }
      }
    };

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      if (mobileToggle && mobileToggle.checked && collapseToggle) {
        inactivityTimer = setTimeout(() => {
          mobileToggle.checked = false; // Esconde a sidebar
          collapseToggle.checked = false;
        }, 3000); // 3 segundos de inatividade
      }
    };

    // Sincronizar nav-toggle com sidebarCollapsed
    const handleToggleChange = () => {
      if (toggleSidebar) {
        setSidebarCollapsed(toggleSidebar.checked);
      }
    };

    // Adiciona evento de change explicitamente
    toggleSidebar?.addEventListener("change", handleToggleChange);

    // Adiciona os eventos
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);
    window.addEventListener("touchstart", resetInactivityTimer);

    // Configura inicialização
    handleResize();

    // Remove eventos ao desmontar
    return () => {
      if (toggleSidebar) {
        toggleSidebar.removeEventListener("change", handleToggleChange);
      }
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", resetInactivityTimer);
      window.removeEventListener("keydown", resetInactivityTimer);
      window.removeEventListener("touchstart", resetInactivityTimer);
    };
  }, []);

  const layoutRefWidth = useRef<HTMLDivElement>(null);
  const layoutRefHeight = useRef<HTMLDivElement>(null); // Corrigido: useRef

  const [layoutWidth, setLayoutWidth] = useState<number>(0);
  const [layoutHeight, setLayoutHeight] = useState<number>(0);

  useEffect(() => {
    const updateDimensions = () => {
      // Atualiza a largura
      if (layoutRefWidth.current) {
        setLayoutWidth(layoutRefWidth.current.getBoundingClientRect().width);
      }

      // Atualiza a altura
      if (layoutRefHeight.current) {
        setLayoutHeight(layoutRefHeight.current.getBoundingClientRect().height);
      }
    };

    // Adiciona o evento de resize
    window.addEventListener("resize", updateDimensions);
    updateDimensions(); // Calcula inicialmente

    // Remove o evento ao desmontar
    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  //console.log("Layout: " + layoutRefWidth + " " + layoutRefHeight);

  // No início do Layout.tsx, adiciona estados
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    console.log("Usuário desconectado"); // Garante que aparece antes do redirecionamento
    window.location.href = "/"; // Redireciona pro Dashboard
  };

  return (
    <div className="principal">
      <input
        id="nav-toggle"
        type="checkbox"
        style={{ display: "none" }}
        defaultChecked={sidebarCollapsed}
        checked={sidebarCollapsed} // Controla diretamente com o estado
        onChange={(e) => setSidebarCollapsed(e.target.checked)} // Adiciona onChange
      />
      <input type="checkbox" id="mobile-sidebar-toggle" style={{ display: "none" }} />
      <input type="checkbox" id="collapse-toggle" style={{ display: "none" }} />

      <div className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`} ref={layoutRefHeight}>
        <div className="sidebar__header">
          <a className="sidebar__logo-icon" href="https://belgocercases.com.br/" target="_blank">
            <img
              className="sidebar__logo-icon"
              alt="Logo"
              src={
                sidebarCollapsed
                  ? "/brand/LG-BELGO-CERCAS-SEMI-NEGATICVO-CMYK_B.png"
                  : "/brand/LG-BELGO-CERCAS-SEMI-NEGATICVO-CMYK.png"
              }
            />
          </a>
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
            {mainSidebarItems.map((item) => (
              <Link
                key={item.id}
                to={item.id === "dashboard" ? "/" : "/products"}
                className="sidebar__nav-item"
              >
                {/* <img className={item.iconClass} alt={item.label} /> */}
                <FontAwesomeIcon icon={item.icon} className="sidebar__icon" />
                <span className="sidebar__nav-title">{item.label}</span>
              </Link>
            ))}
          </div>
          <div className="col">
            <div className="sidebar__wrapper">
              {secondarySidebarItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/${item.id}`}
                  className="sidebar__nav-item"
                  title="Funcionalidade em desenvolvimento"
                >
                  {/* <img className="home-icon" alt={item.label} src={item.icon} /> */}
                  <FontAwesomeIcon icon={item.icon} className="sidebar__icon" />
                  <span className="sidebar__nav-title">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div id="nav-content-highlight"></div>
        <div className="sidebar__footer">
          <div className="sidebar__nav-item5" onClick={handleLogout} style={{ cursor: "pointer" }}>
            {/* <img className="sidebar__icon" alt={footerItem.label} src={footerItem.icon} /> */}
            <FontAwesomeIcon icon={faIcons.faArrowLeft} className="sidebar__icon" />
            <span className="sidebar__nav-title">{footerItem.label}</span>
          </div>
        </div>
      </div>

      <div className="main" ref={layoutRefWidth}>
        <div className="mobile-menu">
          <label htmlFor="mobile-sidebar-toggle">
            <img src="/images/b-cercas.png" alt="Menu" className="mobile-menu-icon" />
          </label>
        </div>
        <div className="mobile-menu">
          <label htmlFor="collapse-toggle">
            <img src="/images/menu.png" alt="Menu" className="mobile-arrow-icon" />
          </label>
        </div>
        <div className="page-header">
          <div className="page-header__title">
            <span>CONTEÚDO OPCIONAL AQUI?...</span>
          </div>
          <div className="page-header__notification">
            <img
              className="page-header__bell-icon"
              alt="Notificações"
              src="/images/Bell.svg"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              style={{ cursor: "pointer" }}
            />
            <div className="page-header__bullet" />
            {isNotificationOpen && (
              <div className="notification-dropdown">
                <h3>Notificações</h3>
                <p>Nenhuma nova notificação no momento.</p>
              </div>
            )}
          </div>
          <div className="page-header__profile">
            <img
              className="page-header__profile-child"
              alt="Avatar"
              src="/images/Rectangle 1.png"
            />
            <span
              className="page-header__user"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              style={{ cursor: "pointer" }}
            >
              Luciana
            </span>
            <img
              className="page-header__home-icon"
              alt="Dropdown"
              src="/images/Chevron Down.svg"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              style={{ cursor: "pointer" }}
            />
            {isProfileOpen && (
              <div className="profile-menu">
                <button>Meu Perfil</button>
                <button>Trocar Senha</button>
                <button>Configurações</button>
                <button onClick={handleLogout}>Sair</button>
                <button>(Em Desenv.)</button>
              </div>
            )}
          </div>
        </div>
        <div className="body">
          <div className="header">
            <p className="header__title">{breadcrumbMap[location.pathname] || "Página"}</p>
            {!isSmallScreen && (
              <div className="header__crumbs">
                {getBreadcrumbs().map((crumb, index) => (
                  <React.Fragment key={crumb.path}>
                    <div
                      className={`header__crumbs-item${index === getBreadcrumbs().length - 1 ? "1" : ""}`}
                    >
                      <Link to={crumb.path} className="header__link">
                        {crumb.label}
                      </Link>
                    </div>
                    {index < getBreadcrumbs().length - 1 && (
                      <div className="header__crumb-separator">
                        <span className="header__link">/</span>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
          <div className="dinamico">
            {children} {/* Aqui entra o conteúdo variável */}
          </div>
        </div>
      </div>

      <div className="footer">
        {/* <div className="footer__mini-stack">
          <span>Developed by </span>
          <span>0.0.0.0.</span>
        </div> */}
        <div>Developed by </div>
        <img className="footer__img" src="/images/lf.png"></img>
      </div>
    </div>
  );
};

export default Layout;
