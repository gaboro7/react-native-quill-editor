/********************************************
 * WebViewQuillEditor.js
 * A Quill.js editor component for use in react-native
 * applications that need to avoid using native code
 *
 */
import React from 'react';
import { View, ActivityIndicator, StyleSheet, WebView, Alert } from 'react-native';
import PropTypes from 'prop-types';
import renderIf from 'render-if';

const config = {
    PACKAGE_NAME: 'react-native-webview-quilljs',
    PACKAGE_VERSION: '0.4.4',

    // use the local html files from the dist folder instead of using the downloaded ones
    // used for debugging
    USE_LOCAL_FILES: true
  };

const MESSAGE_PREFIX = 'react-native-webview-quilljs';

export default class WebViewQuillEditor extends React.Component {
	constructor() {
		super();
		this.state = {
			webViewNotLoaded: true, // flag to show activity indicator
			webViewFilesNotAvailable: true
		};
	}

	componentDidMount() {
		this.setState({ webViewFilesNotAvailable: false });
	}

	createWebViewRef = (webview) => {
		this.webview = webview;
	};

	handleMessage = (event) => {
		let msgData;
		try {
			msgData = JSON.parse(event.nativeEvent.data);
			if (msgData.hasOwnProperty('prefix') && msgData.prefix === MESSAGE_PREFIX) {
				console.log(`WebViewQuillEditor: received message ${msgData.type}`, msgData);
				this.sendMessage('MESSAGE_ACKNOWLEDGED');
				console.log(`WebViewQuillEditor: sent MESSAGE_ACKNOWLEDGED`);

				switch (msgData.type) {
					case 'EDITOR_LOADED':
						this.setState({ webViewNotLoaded: false });
						this.editorLoaded();
						break;
					case 'TEXT_CHANGED':
						if (this.props.onDeltaChangeCallback) this.props.onDeltaChangeCallback(msgData.payload.delta);
						break;
					case 'RECEIVE_DELTA':
						if (this.props.getDeltaCallback) this.props.getDeltaCallback(msgData.payload);
						break;
					default:
						console.warn(`WebViewQuillEditor Error: Unhandled message type received "${msgData.type}"`);
				}
			}
		} catch (err) {
			console.warn(err);
			return;
		}
	};

	webViewLoaded = () => {
		console.log('Webview loaded');
		this.setState({ webViewNotLoaded: false });
		this.sendMessage('LOAD_EDITOR', {
			theme: this.props.theme
		});
		if (this.props.hasOwnProperty('backgroundColor')) {
			this.sendMessage('SET_BACKGROUND_COLOR', {
			  backgroundColor: this.props.backgroundColor
			});
		  }
	  
	};

	editorLoaded = () => {
		// send the content to the editor if we have it
		if (this.props.hasOwnProperty('contentToDisplay')) {
			this.sendMessage('SET_CONTENTS', {
				delta: this.props.contentToDisplay
			});
		}
		if (this.props.hasOwnProperty('htmlContentToDisplay')) {
			this.sendMessage('SET_HTML_CONTENTS', {
				html: this.props.htmlContentToDisplay
			});
		}
	};

	sendMessage = (type, payload) => {
		// only send message when webview is loaded
		if (this.webview) {
			// console.log(`WebViewQuillEditor: sending message ${type}`);
			this.webview.postMessage(
				JSON.stringify({
					prefix: MESSAGE_PREFIX,
					type,
					payload
				}),
				'*'
			);
		}
	};

	// get the contents of the editor.  The contents will be in the Delta format
	// defined here: https://quilljs.com/docs/delta/
	getDelta = () => {
		this.sendMessage('GET_DELTA');
	};

	render = () => {
    const jsCode = 'window.postMessage(document.getElementsByClassName("price bold some-class-name"))';
		return (
			<View
				style={{
					flex: 1
				}}
			>
				{renderIf(!this.state.webViewFilesNotAvailable && config.USE_LOCAL_FILES)(
					<WebView
						style={{
							...StyleSheet.absoluteFillObject,
							padding: 10
						}}
						ref={this.createWebViewRef}
						source={require('./assets/dist/reactQuillEditor-index.html')}
						onLoadEnd={this.webViewLoaded}
						onMessage={this.handleMessage}
					/>
				)}
			</View>
		);
	};
}

WebViewQuillEditor.propTypes = {
	getDeltaCallback: PropTypes.func,
	contentToDisplay: PropTypes.object,
	onDeltaChangeCallback: PropTypes.func,
	backgroundColor: PropTypes.string
};

// Specifies the default values for props:
WebViewQuillEditor.defaultProps = {
	theme: 'snow'
};

const styles = StyleSheet.create({
	activityOverlayStyle: {
		...StyleSheet.absoluteFillObject,
		display: 'flex',
		justifyContent: 'center',
		alignContent: 'center',
		borderRadius: 0
	},
	activityIndicatorContainer: {
		backgroundColor: 'white',
		padding: 10,
		borderRadius: 50,
		alignSelf: 'center',
		shadowColor: '#000000',
		shadowOffset: {
			width: 0,
			height: 3
		},
		shadowRadius: 5,
		shadowOpacity: 1.0
	}
});
