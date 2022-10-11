import RetroApplication from "./Application.js";

import "./style.css";

export function main(argv) {
  const application = new RetroApplication();
  return application.run(argv);
}
