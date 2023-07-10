class Legacy_Unlock extends Component {
  constructor(props) {
    super();

    this.state = {
      loading: false,
      error: null,
    };
  }

  componentWillMount() {
    stores.emitter.on(CONNECTION_CONNECTED, this.connectionConnected);
    stores.emitter.on(CONNECTION_DISCONNECTED, this.connectionDisconnected);
    stores.emitter.on(ERROR, this.error);
  }

  componentWillUnmount() {
    stores.emitter.removeListener(
      CONNECTION_CONNECTED,
      this.connectionConnected
    );
    stores.emitter.removeListener(
      CONNECTION_DISCONNECTED,
      this.connectionDisconnected
    );
    stores.emitter.removeListener(ERROR, this.error);
  }

  error = (err) => {
    this.setState({ loading: false, error: err });
  };

  connectionConnected = () => {
    stores.dispatcher.dispatch({
      type: CONFIGURE_SS,
      content: { connected: true },
    });

    if (this.props.closeModal != null) {
      this.props.closeModal();
    }
  };

  connectionDisconnected = () => {
    stores.dispatcher.dispatch({
      type: CONFIGURE_SS,
      content: { connected: false },
    });
    if (this.props.closeModal != null) {
      this.props.closeModal();
    }
  };

  render() {
    const { classes, closeModal } = this.props;

    return (
      <div className={classes.root}>
        <div className={classes.closeIcon} onClick={closeModal}>
          <Close />
        </div>
        <div className={classes.contentContainer}>
          <Web3ReactProvider getLibrary={getLibrary}>
            <MyComponent closeModal={closeModal} />
          </Web3ReactProvider>
        </div>
      </div>
    );
  }
}
