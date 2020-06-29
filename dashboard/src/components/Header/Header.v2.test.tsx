import { shallow } from "enzyme";
import * as React from "react";
import { IClusterState } from "../../reducers/cluster";
import { app } from "../../shared/url";
import Header from "./Header.v2";

const defaultProps = {
  authenticated: true,
  fetchNamespaces: jest.fn(),
  logout: jest.fn(),
  cluster: {
    currentNamespace: "default",
    namespaces: ["default", "other"],
  } as IClusterState,
  defaultNamespace: "kubeapps-user",
  pathname: "",
  push: jest.fn(),
  setNamespace: jest.fn(),
  createNamespace: jest.fn(),
  getNamespace: jest.fn(),
  featureFlags: { operators: false, additionalClusters: [], ui: "hex" },
};

it("renders the header links and titles", () => {
  const wrapper = shallow(<Header {...defaultProps} />);
  const items = wrapper.find(".nav-link");
  const expectedItems = [
    { children: "Applications", to: app.apps.list("default") },
    { children: "Catalog", to: app.catalog("default") },
  ];
  expect(items.length).toEqual(expectedItems.length);
  expectedItems.forEach((expectedItem, index) => {
    expect(expectedItem.children).toBe(items.at(index).text());
    expect(expectedItem.to).toBe(items.at(index).prop("to"));
  });
});

it("should skip the links if it's not authenticated", () => {
  const wrapper = shallow(<Header {...defaultProps} authenticated={false} />);
  const items = wrapper.find(".nav-link");
  expect(items).not.toExist();
});
