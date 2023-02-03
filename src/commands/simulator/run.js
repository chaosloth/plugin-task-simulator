const { flags } = require("@oclif/command");
const { cli } = require("cli-ux");
const axios = require("axios");
const { TwilioClientCommand } = require("@twilio/cli-core").baseCommands;
const { TwilioCliError } = require("@twilio/cli-core").services.error;
const { sleep } = require("@twilio/cli-core").services.JSUtils;
const querystring = require("querystring");

const RUNNING_LOOP_DELAY_IN_SECONDS = 2;

class SimulatorRun extends TwilioClientCommand {
  constructor(argv, config, secureStorage) {
    super(argv, config, secureStorage);

    this.showHeaders = true;
    this.latestLogEvents = [];
  }

  async run() {
    await super.run();

    this.logger.info("🐥 Agent/Task Simulator");

    const props = this.parseProperties() || {};
    this.validatePropsAndFlags(props, this.flags);

    let agents = await cli.prompt("How many agents do you want to simulate?", {
      default: "5",
      required: true,
    });
    let arrivalRate = await cli.prompt(
      "What is the task arrival rate per second?",
      { default: "1", required: true }
    );

    cli.prideAction.start("Running simulator");

    while (this.flags.running) {
      console.clear();
      this.logger.info("Inside the loop");
      try {
        await this.printStatusTable();
      } catch (err) {
        console.log(err);
      }

      await sleep(RUNNING_LOOP_DELAY_IN_SECONDS * 1000);
    }

    cli.action.stop();
    this.logger.info("🐥 Fin.");
  }

  async printStatusTable() {
    this.logger.info("Fetching data");
    const { data } = await axios.get(
      "https://jsonplaceholder.typicode.com/users"
    );
    // this.logger.info("Printing Data");
    // console.log(data);
    this.logger.info("Printing Table");
    cli.table(data, {
      name: {
        minWidth: 7,
      },
      company: {
        get: (row) => row.company && row.company.name,
      },
      id: {
        header: "ID",
        extended: true,
      },
    });
  }

  validatePropsAndFlags(props, flags) {
    this.flags.authToken =
      this.flags["auth-token"] || process.env.TWILIO_AUTH_TOKEN;
    // if (!this.flags.authToken) {
    //   throw new TwilioCliError("Auth token not set");
    // }
  }
}

SimulatorRun.description = `Run an agent/task simulator`;

SimulatorRun.flags = Object.assign(
  {
    "auth-token": flags.string({
      description: "The auth token for the account to validate requests for.",
    }),
    properties: flags.string({
      default: "workers, taskPerSecond",
      description:
        "The number of workers to handle tasks, and the tasks per second to create",
    }),
    running: flags.boolean({
      char: "r",
      description: "Continuously run simulator event loop",
    }),
  },
  TwilioClientCommand.flags
);

module.exports = SimulatorRun;
