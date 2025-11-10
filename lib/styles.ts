import { StyleSheet } from "react-native";
import Colors from "./colors";

const Styles = StyleSheet.create({
  primaryButton: {
    width: "100%",
    height: 40,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  outlineButton: {
    width: "100%",
    height: 40,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  outlineButtonText: {
    color: Colors.primary,
    fontWeight: "bold",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    height: 40,
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  descriptionInput: {
    height: 40,
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    minHeight: 100,
  },
  inputLabel: {
    marginBottom: 5,
    paddingStart: 5,
    color: Colors.gray,
  },
  inputError: {
    color: "red",
    marginBottom: 5,
  },
});

export default Styles;
