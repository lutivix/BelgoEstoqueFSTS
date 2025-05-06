import React, { createContext, useState, useEffect, useContext, useRef } from "react";
import "../Styles/Layout.css"; // Mantendo a importação do CSS do usuário
import { Link, useLocation } from "react-router-dom";
import * as faIcons from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Contexto para armazenar a largura e altura
const LayoutWidthContext = createContext<number>(0);
const LayoutHeightContext = createContext<number>(0);

export const useLayoutWidth = () => useContext(LayoutWidthContext);
export const useLayoutHeigth = () => useContext(LayoutHeightContext);

// Combinando os itens do sidebar
const mainSidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: faIcons.faHouse, path: "/" },
  { id: "products", label: "Produtos", icon: faIcons.faBoxesStacked, path: "/products" },
  // Adicionando o item Botões com um ícone FontAwesome e path
  { id: "buttons", label: "Botões", icon: faIcons.faPalette, path: "/buttons" },
];

const secondarySidebarItems = [
  { id: "reports", label: "Relatórios", icon: faIcons.faFileAlt, path: "/reports" },
  { id: "settings", label: "Configurações", icon: faIcons.faCog, path: "/settings" },
  { id: "help", label: "Help Centre", icon: faIcons.faQuestionCircle, path: "/help" },
];

// Mantendo o item de logout do usuário
const footerItem = { id: "logout", label: "Sair", icon: faIcons.faArrowLeft };

// Combinando os breadcrumbs
const breadcrumbMap: Record<string, string> = {
  "/": "Dashboard",
  "/products": "Produtos",
  "/reports": "Relatórios",
  "/settings": "Configurações",
  "/help": "Suporte",
  "/buttons": "Botões", // Adicionando breadcrumb para Botões
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  // Mantendo a lógica de estado e efeitos do usuário (localStorage, responsividade)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 768);
  const location = useLocation(); // Usando useLocation

  // Salvar sidebarCollapsed no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Mantendo a lógica de breadcrumbs do usuário
  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split("/").filter((x) => x);
    const crumbs = [{ path: "/", label: "Dashboard" }];
    if (pathnames.length > 0) {
      const fullPath = `/${pathnames.join("/")}`;
      if (breadcrumbMap[fullPath]) {
        if (fullPath !== "/") {
          crumbs.push({ path: fullPath, label: breadcrumbMap[fullPath] });
        }
      } else {
        // Fallback opcional
      }
    }
    return crumbs;
  };

  // Mantendo os useEffects complexos do usuário para resize, inatividade, etc.
  useEffect(() => {
    const toggleSidebar = document.querySelector<HTMLInputElement>("#nav-toggle");
    const mobileToggle = document.querySelector<HTMLInputElement>("#mobile-sidebar-toggle");
    const collapseToggle = document.querySelector<HTMLInputElement>("#collapse-toggle");
    let inactivityTimer: number | undefined;

    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 768);
      if (toggleSidebar && mobileToggle) {
        const savedCollapsed = JSON.parse(localStorage.getItem("sidebarCollapsed") || "false");
        if (window.innerWidth <= 1024 && window.innerWidth > 768) {
          // Não forçar o estado aqui, deixar o usuário controlar via clique/localStorage
          // toggleSidebar.checked = true;
          // setSidebarCollapsed(true);
        } else {
          // Não forçar o estado aqui
          // toggleSidebar.checked = false;
          // setSidebarCollapsed(false);
          // mobileToggle.checked = false;
        }
      }
    };

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      if (mobileToggle && mobileToggle.checked && collapseToggle) {
        inactivityTimer = setTimeout(() => {
          if (mobileToggle) mobileToggle.checked = false;
          if (collapseToggle) collapseToggle.checked = false;
        }, 3000);
      }
    };

    const handleToggleChange = () => {
      if (toggleSidebar) {
        setSidebarCollapsed(toggleSidebar.checked);
      }
    };

    toggleSidebar?.addEventListener("change", handleToggleChange);
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);
    window.addEventListener("touchstart", resetInactivityTimer);

    handleResize(); // Chamar na inicialização

    return () => {
      toggleSidebar?.removeEventListener("change", handleToggleChange);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", resetInactivityTimer);
      window.removeEventListener("keydown", resetInactivityTimer);
      window.removeEventListener("touchstart", resetInactivityTimer);
      clearTimeout(inactivityTimer); // Limpar timer ao desmontar
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependências vazias mantidas conforme original do usuário

  // Mantendo a lógica de refs e context do usuário
  const layoutRefWidth = useRef<HTMLDivElement>(null);
  const layoutRefHeight = useRef<HTMLDivElement>(null);
  const [layoutWidth, setLayoutWidth] = useState<number>(0);
  const [layoutHeight, setLayoutHeight] = useState<number>(0);

  useEffect(() => {
    const updateDimensions = () => {
      if (layoutRefWidth.current) {
        setLayoutWidth(layoutRefWidth.current.getBoundingClientRect().width);
      }
      if (layoutRefHeight.current) {
        setLayoutHeight(layoutRefHeight.current.getBoundingClientRect().height);
      }
    };
    window.addEventListener("resize", updateDimensions);
    updateDimensions();
    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  // Mantendo estados de dropdown do usuário
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Mantendo função de logout do usuário
  const handleLogout = () => {
    console.log("Usuário desconectado");
    window.location.href = "/";
  };

  return (
    // Envolvendo com os providers de contexto
    <LayoutWidthContext.Provider value={layoutWidth}>
      <LayoutHeightContext.Provider value={layoutHeight}>
        <div className="principal">
          {/* Input controlado pelo estado sidebarCollapsed */}
          <input
            id="nav-toggle"
            type="checkbox"
            style={{ display: "none" }}
            checked={sidebarCollapsed}
            onChange={(e) => setSidebarCollapsed(e.target.checked)}
          />
          <input type="checkbox" id="mobile-sidebar-toggle" style={{ display: "none" }} />
          <input type="checkbox" id="collapse-toggle" style={{ display: "none" }} />

          {/* Mantendo a estrutura do sidebar do usuário, usando ref */}
          <div className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`} ref={layoutRefHeight}>
            <div className="sidebar__header">
              <a className="sidebar__logo-icon" href="https://belgocercases.com.br/" target="_blank" rel="noopener noreferrer">
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
                {/* Usando a estrutura de Link e FontAwesome do usuário */}
                {mainSidebarItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`sidebar__nav-item ${location.pathname === item.path ? "active" : ""}`}
                  >
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
                      to={item.path}
                      className={`sidebar__nav-item ${location.pathname === item.path ? "active" : ""}`}
                      // title="Funcionalidade em desenvolvimento" // Pode ser adicionado se necessário
                    >
                      <FontAwesomeIcon icon={item.icon} className="sidebar__icon" />
                      <span className="sidebar__nav-title">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div id="nav-content-highlight"></div>
            {/* Usando a estrutura de logout do usuário com FontAwesome */}
            <div className="sidebar__footer">
              <div className="sidebar__nav-item5" onClick={handleLogout} style={{ cursor: "pointer" }}>
                <FontAwesomeIcon icon={footerItem.icon} className="sidebar__icon" />
                <span className="sidebar__nav-title">{footerItem.label}</span>
              </div>
            </div>
          </div>

          {/* Mantendo a estrutura do main e header do usuário, usando ref */}
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
                {/* Conteúdo opcional mantido */}
                {/* <span>CONTEÚDO OPCIONAL AQUI?...</span> */}
              </div>
              {/* Mantendo dropdowns de notificação e perfil */}
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
                {children} {/* Conteúdo da página renderizado aqui */}
              </div>
            </div>
          </div>

          {/* Mantendo footer do usuário */}
          <div className="footer">
            <div>Developed by </div>
            <img className="footer__img" src="/images/lf.png" alt="LF Logo"></img>
          </div>
        </div>
      </LayoutHeightContext.Provider>
    </LayoutWidthContext.Provider>
  );
};

export default Layout;

