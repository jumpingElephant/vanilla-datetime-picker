# Contributing

Thanks for your interest in contributing!

- Before opening a PR, please open an issue to discuss significant changes.
- For small fixes (typos, docs, lint), a PR is fine without prior discussion.

## Development

- Requirements: Node 18+ (Node 20 recommended).
- Install dependencies:
    - npm ci
- Build:
    - npm run build
- Dev builds (watch):
    - npm run dev:esm
    - npm run dev:iife
- Lint:
    - npm run lint

## Coding Guidelines

- Keep the library dependency-free.
- Avoid adding global side effects.
- Ensure accessibility (keyboard navigation, ARIA where applicable).
- Maintain ESM and IIFE build compatibility.

## Commits and PRs

- Use clear, descriptive commit messages.
- Reference related issues with `Fixes #123` where applicable.
- Keep PRs focused and reasonably small.

## Versioning and Releases

- We follow SemVer.
- Maintainers cut releases by:
    - bumping version in `package.json`
    - tagging `vX.Y.Z`
    - pushing tags to trigger the release workflow.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
