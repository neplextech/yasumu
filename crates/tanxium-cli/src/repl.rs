//! A small multiline REPL for the Tanxium runtime.

use anyhow::Result;
use std::io::{self, BufRead, Write};
use tanxium::Tanxium;

/// Runs an interactive session until `.exit`, `.quit`, or end-of-input.
pub fn run(runtime: Tanxium) -> Result<()> {
    let stdin = io::stdin();
    let mut stdout = io::stdout();
    let mut source = String::new();
    let mut buffer = String::new();

    writeln!(stdout, "Tanxium REPL — .help for commands")?;
    loop {
        write!(stdout, "{}", if buffer.is_empty() { "> " } else { "… " })?;
        stdout.flush()?;
        let mut line = String::new();
        if stdin.lock().read_line(&mut line)? == 0 {
            break;
        }

        match line.trim() {
            ".exit" | ".quit" if buffer.is_empty() => break,
            ".clear" if buffer.is_empty() => {
                source.clear();
                writeln!(stdout, "Session cleared.")?;
                continue;
            }
            ".help" if buffer.is_empty() => {
                writeln!(
                    stdout,
                    ".help  .clear  .exit  .quit\nSubmit a blank line after multiline input. Top-level await is supported."
                )?;
                continue;
            }
            _ => {}
        }

        buffer.push_str(&line);
        if !is_complete(&buffer) || !line.trim().is_empty() {
            continue;
        }

        let submission_len = buffer.len();
        source.push_str(&buffer);
        buffer.clear();
        let path = std::env::temp_dir().join(format!("tanxium-repl-{}.ts", std::process::id()));
        std::fs::write(&path, &source)?;
        if let Err(error) = runtime.run_file_blocking(&path) {
            eprintln!("{error:#}");
            source.truncate(source.len().saturating_sub(submission_len));
        }
    }
    Ok(())
}

fn is_complete(source: &str) -> bool {
    let mut depth = 0_i32;
    for character in source.chars() {
        match character {
            '{' | '(' | '[' => depth += 1,
            '}' | ')' | ']' => depth -= 1,
            _ => {}
        }
    }
    depth <= 0
}
