class MySnackbar extends Component {
  state = {
    open: this.props.open,
  };

  handleClick = () => {
    this.setState({ open: true });
  };

  handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    this.setState({ open: false });
  };

  render() {
    const { type, message } = this.props;

    let icon = <SuccessIcon color={colors.blue} />;
    let color = colors.blue;
    let messageType = "";
    let actions = [
      <IconButton key="close" aria-label="Close" onClick={this.handleClose}>
        <CloseIcon />
      </IconButton>,
    ];

    switch (type) {
      case "Error":
        icon = <ErrorIcon color={colors.red} />;
        color = colors.red;
        messageType = "Error";
        break;
      case "Success":
        icon = <SuccessIcon color={colors.blue} />;
        color = colors.blue;
        messageType = "Success";
        break;
      case "Warning":
        icon = <WarningIcon color={colors.orange} />;
        color = colors.orange;
        messageType = "Warning";
        break;
      case "Info":
        icon = <InfoIcon color={colors.blue} />;
        color = colors.blue;
        messageType = "Info";
        break;
      case "Hash":
        icon = <SuccessIcon color={colors.blue} />;
        color = colors.blue;
        messageType = "Hash";

        let snackbarMessage = ETHERSCAN_URL + "tx/" + message;
        actions = [
          <Button
            variant="text"
            size="small"
            onClick={() => window.open(snackbarMessage, "_blank")}
          >
            View
          </Button>,
          <IconButton key="close" aria-label="Close" onClick={this.handleClose}>
            <CloseIcon />
          </IconButton>,
        ];
        break;
      default:
        icon = <SuccessIcon color={colors.blue} />;
        color = colors.blue;
        messageType = "Success";
        break;
    }

    return (
      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        open={this.state.open}
        autoHideDuration={16000}
        onClose={this.handleClose}
        style={{ borderRadius: "18px", backgroundColor: color, padding: "5px" }}
        message={
          <div
            style={{
              padding: "18px",
              border: "0px solid " + color,
              backgroundColor: "none",
            }}
          >
            {icon}
            <div
              style={{
                display: "inline-block",
                verticalAlign: "middle",
                maxWidth: "400px",
                overflowX: "hidden",
              }}
            >
              <Typography
                variant="body1"
                style={{
                  fontSize: "14px",
                  marginBottom: "6px",
                  fontWeight: "700",
                  color: color,
                }}
              >
                {messageType}
              </Typography>
              <Typography variant="body1" style={{ fontSize: "12px" }}>
                {message}
              </Typography>
            </div>
          </div>
        }
        action={actions}
      />
    );
  }
}
