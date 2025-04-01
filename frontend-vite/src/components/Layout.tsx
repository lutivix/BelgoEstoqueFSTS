import { useState } from "react"; // Adiciona o import do useState
import { Box, Typography } from "@mui/material";
import "./Layout.css";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <Box className="expanded-sidebar">
      <input
        id="nav-toggle"
        type="checkbox"
        checked={sidebarCollapsed}
        onChange={() => setSidebarCollapsed(!sidebarCollapsed)}
        style={{ display: "none" }}
      />

      <Box className="sidebar">
        <Box className="header">
          <img
            className="logo-icon"
            alt="Logo"
            src={sidebarCollapsed ? "/images/b-cercas.png" : "/images/belgo-cercas.png"}
          />
          <hr />
          <label htmlFor="nav-toggle" className="sidebarcollapse-button">
            <img
              className="arrow-left-icon"
              alt="Toggle"
              src={sidebarCollapsed ? "/images/Arrow Right.svg" : "/images/Arrow Left.svg"}
            />
          </label>
        </Box>
        <Box className="navbar">
          <Box className="wrapper">
            <Box className="sidebarnav-item">
              <img className="home-icon" alt="Dashboard" src="/images/Home.svg" />
              <Typography className="dashboard">Dashboard</Typography>
            </Box>
            <Box className="sidebarnav-item">
              <img className="home-icon" alt="Produtos" src="/images/Spinner.svg" />
              <Typography className="dashboard">Produtos</Typography>
            </Box>
          </Box>
          <Box className="col">
            <Box className="wrapper">
              <Box className="sidebarnav-item">
                <img className="home-icon" alt="Mensagens" src="/images/Mail.svg" />
                <Typography className="dashboard">Mensagens</Typography>
              </Box>
              <Box className="sidebarnav-item">
                <img className="home-icon" alt="Configurações" src="/images/Setting.svg" />
                <Typography className="dashboard">Configurações</Typography>
              </Box>
              <Box className="sidebarnav-item">
                <img className="home-icon" alt="Help" src="/images/Help.svg" />
                <Typography className="dashboard">Help centre</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
        <Box className="navbar1">
          <Box className="sidebarnav-item5">
            <img className="home-icon" alt="Sair" src="/images/Arrow Left.svg" />
            <Typography className="dashboard">Sair</Typography>
          </Box>
        </Box>
      </Box>

      <Box className="main">
        <Box className="page-header">
          <Box className="notification">
            <img className="bell-icon" alt="Notificações" src="/images/Bell.svg" />
            <Box className="bullet" />
          </Box>
          <Box className="profile">
            <img className="profile-child" alt="Avatar" src="/images/Rectangle 1.png" />
            <Typography className="luciana">Luciana</Typography>
            <img className="home-icon" alt="Dropdown" src="/images/Chevron Down.svg" />
          </Box>
        </Box>
        <Box className="content-area">
          {children} {/* Aqui entra o conteúdo variável */}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;