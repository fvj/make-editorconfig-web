import React from 'react'
import { Form, Loader, Dimmer, Icon } from 'semantic-ui-react'

export default ({
	repositoryUser,
	repositoryName,
	config,
	generateConfig,
	handleInputChange,
	showConfigModal,
	loading,
}) => (
	<Form>
		<Form.Group widths="equal">
			<Form.Input
				id="repository-owner"
				label="User"
				value={repositoryUser}
				onChange={handleInputChange}
				help="The owner of the repository"
			/>
			<Form.Input
				id="repository-name"
				label="Repository"
				type="text"
				value={repositoryName}
				onChange={handleInputChange}
			/>
		</Form.Group>
		<Form.Group>
			<Form.Button
				primary
				id="generate"
				onClick={generateConfig}
				width={15}
				fluid
			>
				Generate
			</Form.Button>
			<Form.Button
				width={1}
				fluid
				content={<Icon name="configure" fitted={false} />}
				onClick={showConfigModal}
			/>
		</Form.Group>
		<div style={{ position: 'relative' }}>
			<Form.TextArea
				id="config"
				value={config}
				autoHeight
				readOnly
				style={{ fontFamily: 'monospace' }}
			/>
			<Dimmer active={loading}>
				<Loader />
			</Dimmer>
		</div>
	</Form>
)
