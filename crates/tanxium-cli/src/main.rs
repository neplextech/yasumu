//! Command-line entrypoint for Tanxium.

mod repl;
mod terminal_host;

use anyhow::Result;
use clap::{ArgAction, Parser, Subcommand, builder::BoolishValueParser};
use std::{path::PathBuf, sync::Arc};
use tanxium::{Tanxium, install_permission_prompter};
use terminal_host::TerminalHost;

/// Execute scripts or start an interactive Tanxium session.
#[derive(Parser)]
#[command(
    name = "tanxium",
    version,
    about = "Run JavaScript and TypeScript with Tanxium"
)]
struct Cli {
    /// Start the main worker without permissions and prompt when it requests one.
    #[arg(
        long,
        global = true,
        action = ArgAction::Set,
        default_value_t = true,
        value_parser = BoolishValueParser::new()
    )]
    sandbox: bool,
    /// Grant all permissions to the main worker (equivalent to `--sandbox false`).
    #[arg(long = "no-sandbox", global = true, action = ArgAction::SetTrue)]
    no_sandbox: bool,
    /// Allow modules to be imported over insecure HTTP.
    #[arg(long, global = true, action = ArgAction::SetTrue)]
    allow_http_imports: bool,
    #[command(subcommand)]
    command: Option<Command>,
}

impl Cli {
    fn sandboxed(&self) -> bool {
        self.sandbox && !self.no_sandbox
    }
}

/// Supported CLI commands.
#[derive(Subcommand)]
enum Command {
    /// Run a JavaScript or TypeScript entrypoint.
    Run {
        /// Entrypoint file to execute.
        file: PathBuf,
        /// Workspace used for package resolution.
        #[arg(long)]
        workspace: Option<PathBuf>,
        /// Resource root exposed to the Yasumu runtime.
        #[arg(long)]
        resources: Option<PathBuf>,
        /// Print JSON renderer events emitted by the runtime.
        #[arg(long)]
        verbose: bool,
    },
    /// Start an interactive JavaScript/TypeScript session.
    Repl {
        /// Workspace used for package resolution.
        #[arg(long)]
        workspace: Option<PathBuf>,
        /// Resource root exposed to the Yasumu runtime.
        #[arg(long)]
        resources: Option<PathBuf>,
        /// Print JSON renderer events emitted by the runtime.
        #[arg(long)]
        verbose: bool,
    },
}

fn build_runtime(
    workspace: Option<PathBuf>,
    resources: Option<PathBuf>,
    verbose: bool,
    sandboxed: bool,
    allow_http_imports: bool,
) -> Result<Tanxium> {
    let cwd = std::env::current_dir()?;
    let host = Arc::new(TerminalHost::new(verbose));
    install_permission_prompter(host.clone());

    Tanxium::builder()
        .workspace_dir(workspace.unwrap_or_else(|| cwd.clone()))
        .resource_dir(resources.unwrap_or(cwd))
        .ready(true)
        .allow_main_worker_all_permissions(!sandboxed)
        .allow_http_imports(allow_http_imports)
        .host(host)
        .build()
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    let sandboxed = cli.sandboxed();

    match cli.command {
        Some(Command::Run {
            file,
            workspace,
            resources,
            verbose,
        }) => build_runtime(
            workspace,
            resources,
            verbose,
            sandboxed,
            cli.allow_http_imports,
        )?
        .run_file_blocking(file),
        Some(Command::Repl {
            workspace,
            resources,
            verbose,
        }) => repl::run(build_runtime(
            workspace,
            resources,
            verbose,
            sandboxed,
            cli.allow_http_imports,
        )?),
        None => repl::run(build_runtime(
            None,
            None,
            false,
            sandboxed,
            cli.allow_http_imports,
        )?),
    }
}
