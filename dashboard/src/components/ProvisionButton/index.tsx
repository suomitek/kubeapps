import { RouterAction } from "connected-react-router";
import * as React from "react";
import * as Modal from "react-modal";

import { IClusterServiceClass } from "../../shared/ClusterServiceClass";
import { IServicePlan } from "../../shared/ServiceCatalog";
import { ForbiddenError, IRBACRole, NotFoundError } from "../../shared/types";
import { NotFoundErrorAlert, PermissionsErrorAlert, UnexpectedErrorAlert } from "../ErrorAlert";
import SchemaForm from "../SchemaForm";

import { JSONSchema6 } from "json-schema";
import { ISubmitEvent } from "react-jsonschema-form";

interface IProvisionButtonProps {
  namespace: string;
  error: Error;
  selectedClass?: IClusterServiceClass;
  selectedPlan: IServicePlan;
  provision: (
    releaseName: string,
    namespace: string,
    className: string,
    planName: string,
    parameters: {},
  ) => Promise<boolean>;
  push: (location: string) => RouterAction;
}

interface IProvisionButtonState {
  isProvisioning: boolean;
  modalIsOpen: boolean;
  name: string;
  displayNameForm: boolean;
}

const RequiredRBACRoles: IRBACRole[] = [
  {
    apiGroup: "servicecatalog.k8s.io",
    resource: "serviceinstances",
    verbs: ["create"],
  },
];

const smallModalStyle = {
  content: {
    bottom: "auto",
    left: "50%",
    marginRight: "-50%",
    right: "auto",
    top: "50%",
    transform: "translate(-50%, -50%)",
  },
};

class ProvisionButton extends React.Component<IProvisionButtonProps, IProvisionButtonState> {
  public state: IProvisionButtonState = {
    displayNameForm: true,
    isProvisioning: false,
    modalIsOpen: false,
    name: "",
  };

  public render() {
    const { selectedPlan } = this.props;
    let schema = selectedPlan.spec.instanceCreateParameterSchema;
    if (!schema) {
      schema = {
        properties: {
          kubeappsRawParameters: {
            title: "Parameters",
            type: "object",
          },
        },
        type: "object",
      };
    }

    return (
      <div className="ProvisionButton">
        {this.state.isProvisioning && <div>Provisioning...</div>}
        <button
          className="button button-primary button-small"
          onClick={this.openModel}
          disabled={this.state.isProvisioning}
        >
          Provision
        </button>
        <Modal
          isOpen={this.state.modalIsOpen}
          onRequestClose={this.closeModal}
          contentLabel="Modal"
          style={this.state.displayNameForm ? smallModalStyle : {}}
        >
          {this.props.error && <div className="margin-b-big">{this.renderError()}</div>}
          {this.state.displayNameForm ? (
            <SchemaForm schema={this.nameSchema()} onSubmit={this.handleNameChange}>
              <div>
                <button className="button button-primary" type="submit">
                  Continue
                </button>
                <button className="button" onClick={this.closeModal}>
                  Cancel
                </button>
              </div>
            </SchemaForm>
          ) : (
            <SchemaForm schema={schema} onSubmit={this.handleProvision}>
              <div>
                <button className="button button-primary" type="submit">
                  Submit
                </button>
                <button className="button" onClick={this.handleBackButton}>
                  Back
                </button>
              </div>
            </SchemaForm>
          )}
        </Modal>
      </div>
    );
  }

  public openModel = () => {
    this.setState({
      modalIsOpen: true,
    });
  };

  public closeModal = () => {
    this.setState({
      modalIsOpen: false,
    });
  };

  public handleBackButton = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    this.setState({ displayNameForm: true });
  };

  public handleNameChange = ({ formData }: ISubmitEvent<{ Name: string }>) => {
    this.setState({ name: formData.Name, displayNameForm: false });
  };

  public handleProvision = async ({
    formData,
  }: ISubmitEvent<{ name: string; kubeappsRawParameters: {} }>) => {
    const { namespace, provision, push, selectedClass, selectedPlan } = this.props;
    const { name } = this.state;
    this.setState({ isProvisioning: true });

    const { kubeappsRawParameters, ...rest } = formData;
    if (selectedClass && selectedPlan) {
      const provisioned = await provision(
        name,
        namespace,
        selectedClass.spec.externalName,
        selectedPlan.spec.externalName,
        kubeappsRawParameters || rest,
      );
      if (provisioned) {
        push(
          `/services/brokers/${
            selectedClass.spec.clusterServiceBrokerName
          }/instances/ns/${namespace}/${name}`,
        );
      } else {
        this.setState({ isProvisioning: false });
      }
    }
  };

  private nameSchema(): JSONSchema6 {
    return {
      properties: {
        Name: {
          default: this.state.name,
          description: "Name for ServiceInstance",
          type: "string",
        },
      },
      required: ["Name"],
      type: "object",
    };
  }

  private renderError() {
    const { error, namespace } = this.props;
    switch (error && error.constructor) {
      case ForbiddenError:
        return (
          <PermissionsErrorAlert
            namespace={namespace}
            roles={RequiredRBACRoles}
            action={"provision Service Instance"}
          />
        );
      case NotFoundError:
        return <NotFoundErrorAlert resource={`Namespace "${namespace}"`} />;
      default:
        return <UnexpectedErrorAlert />;
    }
  }
}

export default ProvisionButton;
