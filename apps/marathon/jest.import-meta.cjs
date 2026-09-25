// Jest runs the app as CommonJS, where `import.meta` is a syntax error. Vite
// exposes build-time env on `import.meta.env`; under Jest, read it from
// `process.env` instead so tests can set VITE_* variables.
module.exports = function importMetaToProcessEnv({ types: t }) {
  return {
    visitor: {
      MetaProperty(path) {
        const { meta, property } = path.node;
        if (meta.name !== 'import' || property.name !== 'meta') return;
        path.replaceWith(
          t.objectExpression([
            t.objectProperty(
              t.identifier('env'),
              t.memberExpression(t.identifier('process'), t.identifier('env')),
            ),
          ]),
        );
      },
    },
  };
};
