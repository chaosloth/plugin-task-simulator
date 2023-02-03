const { cli } = require("cli-ux");
const { TwilioClientCommand } = require("@twilio/cli-core").baseCommands;
const { Flags: flags } = require("@oclif/core");
const chalk = require("chalk");

class SimulatorAgentList extends TwilioClientCommand {
  constructor(argv, config, secureStorage) {
    super(argv, config, secureStorage);
  }

  async run() {
    await super.run();
    this.logger.info(chalk.greenBright("Agent Simulator - List Agents"));

    let workspace = undefined;

    if (!this.flags["workspace-sid"]) {
      let workspaces = await this.twilioClient.taskrouter.v1.workspaces.list({
        limit: 20,
      });

      if (workspaces.length > 1) {
        this.logger.info(
          "More than one workspace, pass workspace SID into command, see --help for details"
        );
        this.logger.log(chalk.bold("Workspaces"));
        workspaces.forEach((w) =>
          this.logger.log(`${w.sid} - ${w.friendlyName}`)
        );
      }

      // Choose the default workspace
      workspace = workspaces[0];
    } else {
      this.logger.info("Using SID from --workspace-sid property");

      workspace = await this.twilioClient.taskrouter.v1
        .workspaces(this.flags["workspace-sid"])
        .fetch();
    }

    this.logger.info(
      `Showing workers from workspace [${workspace.friendlyName}] (${workspace.sid})`
    );

    let simulatedAgents = [];

    // Fetch all agents, check if "simulated" flag exists
    await this.twilioClient.taskrouter.v1
      .workspaces(workspace.sid)
      .workers.list({ limit: 20 })
      .then((workers) =>
        workers.forEach((w) => {
          let attributes = JSON.parse(w.attributes);
          this.logger.debug(JSON.stringify(attributes, null, 2));
          if (attributes.hasOwnProperty("simulated")) {
            simulatedAgents.push(w);
          }
        })
      );

    // Check to see if we have simulated agents
    if (simulatedAgents.length == 0) {
      this.logger.info(
        "No simulated agents found in workspace, create some or set worker attributes"
      );
    } else {
      this.logger.log("\n");
      cli.table(simulatedAgents, {
        sid: {
          minWidth: 36,
        },
        friendlyName: {
          header: "FriendlyName",
        },
      });
    }
  }
}

SimulatorAgentList.description = `Get a list of simulated agents`;

SimulatorAgentList.PropertyFlags = {
  "workspace-sid": flags.string({
    description: "The SID of the Task Router Workspace to use.",
  }),
};

SimulatorAgentList.flags = {
  ...SimulatorAgentList.PropertyFlags,
  ...TwilioClientCommand.flags,
  ...TwilioClientCommand.accountSidFlag,
};

module.exports = SimulatorAgentList;
