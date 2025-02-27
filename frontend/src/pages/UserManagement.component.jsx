import React from 'react';
import styled from 'styled-components';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import UserList from '../components/UserList/UserList.component.jsx';
import PermissionEditor from '../components/PermissionEditor/PermissionEditor.jsx';
import AnalyticsDashboard from './AdminDashboard.component.jsx';

const PageContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr;
  gap: 20px;
  padding: 20px;
  min-height: 100vh;
  background: #f4f4f4;

  @media (min-width: 768px) {
    grid-template-columns: repeat(12, 1fr);
    gap: 30px;
    padding: 40px;
  }
`;

const AdminHeader = styled.h1`
  grid-column: 1 / -1;
  color: #333;
  text-align: center;
`;

const StyledTabs = styled(Tabs)`
  grid-column: 1 / -1;

  @media (min-width: 768px) {
    grid-column: 2 / 12;
  }
`;

const StyledTabList = styled(TabList)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 0;
  padding: 0;
  list-style: none;
`;

const StyledTab = styled(Tab)`
  padding: 10px;
  cursor: pointer;
  text-align: center;
  border: 1px solid #ccc;
  background-color: #fff;

  &:focus {
    outline: none;
  }

  &.react-tabs__tab--selected {
    background-color: #eee;
    border-bottom: 1px solid transparent;
  }
`;

const StyledTabPanel = styled(TabPanel)`
  padding: 20px;
  border: 1px solid #ccc;
  display: none;

  &.react-tabs__tab-panel--selected {
    display: block;
  }
`;

const UserManagement = () => {
  return (
    <PageContainer>
      <AdminHeader>User Management Dashboard</AdminHeader>
      <StyledTabs>
        <StyledTabList>
          <StyledTab>User List</StyledTab>
          <StyledTab>Permissions</StyledTab>
          <StyledTab>Analytics</StyledTab>
        </StyledTabList>

        <StyledTabPanel>
          <UserList />
        </StyledTabPanel>
        <StyledTabPanel>
          <PermissionEditor />
        </StyledTabPanel>
        <StyledTabPanel>
          <AnalyticsDashboard />
        </StyledTabPanel>
      </StyledTabs>
    </PageContainer>
  );
};

export default UserManagement;