import { Command } from "commander";

const COMPLETION_SCRIPT = `
###-begin-zit-completions-###
#
# zit tab completion for bash and zsh
#
# To enable: eval "$(zit completion)"
#

if type complete &>/dev/null; then
  # Bash completion
  _zit_completions() {
    local cur prev words cword
    _get_comp_words_by_ref -n : cur prev words cword 2>/dev/null || {
      cur="\${COMP_WORDS[COMP_CWORD]}"
      prev="\${COMP_WORDS[COMP_CWORD-1]}"
      words=("\${COMP_WORDS[@]}")
      cword=$COMP_CWORD
    }

    local commands="add remove list workspace clone status completion help"
    local ws_subcommands="init list remove"

    case "\${words[1]}" in
      remove)
        COMPREPLY=($(compgen -W "$(zit _list-accounts 2>/dev/null)" -- "$cur"))
        return
        ;;
      workspace|wsp)
        if [ "$cword" -eq 2 ]; then
          COMPREPLY=($(compgen -W "$ws_subcommands" -- "$cur"))
          return
        fi
        case "\${words[2]}" in
          remove)
            COMPREPLY=($(compgen -W "$(zit _list-workspaces 2>/dev/null)" -- "$cur"))
            return
            ;;
          init)
            if [ "$cword" -eq 4 ]; then
              COMPREPLY=($(compgen -W "$(zit _list-accounts 2>/dev/null)" -- "$cur"))
              return
            fi
            COMPREPLY=($(compgen -d -- "$cur"))
            return
            ;;
        esac
        return
        ;;
    esac

    if [ "$cword" -eq 1 ]; then
      COMPREPLY=($(compgen -W "$commands" -- "$cur"))
    fi
  }
  complete -o default -F _zit_completions zit

elif type compdef &>/dev/null; then
  # Zsh completion
  _zit_completions() {
    local commands=(
      'add:Register a new git account'
      'remove:Remove a registered account'
      'list:List all registered accounts'
      'workspace:Manage workspace folders'
      'clone:Clone a repo with workspace SSH key'
      'status:Show current workspace info'
      'completion:Output shell completion script'
      'help:Display help'
    )
    local ws_subcommands=(
      'init:Create a workspace folder linked to an account'
      'list:List all workspaces'
      'remove:Unlink a workspace'
    )

    case "\${words[2]}" in
      remove)
        local accounts=(\${(f)"$(zit _list-accounts 2>/dev/null)"})
        compadd -a accounts
        return
        ;;
      workspace|wsp)
        if (( CURRENT == 3 )); then
          _describe 'subcommand' ws_subcommands
          return
        fi
        case "\${words[3]}" in
          remove)
            local workspaces=(\${(f)"$(zit _list-workspaces 2>/dev/null)"})
            compadd -a workspaces
            return
            ;;
          init)
            if (( CURRENT == 5 )); then
              local accounts=(\${(f)"$(zit _list-accounts 2>/dev/null)"})
              compadd -a accounts
              return
            fi
            _files -/
            return
            ;;
        esac
        return
        ;;
    esac

    if (( CURRENT == 2 )); then
      _describe 'command' commands
    fi
  }
  compdef _zit_completions zit
fi
###-end-zit-completions-###
`.trimStart();

export function registerCompletionCommand(program: Command): void {
  program
    .command("completion")
    .description("Output shell completion script (eval \"$(zit completion)\")")
    .action(() => {
      process.stdout.write(COMPLETION_SCRIPT);
    });
}
