import postcss from 'postcss';

export default postcss.plugin('postcss-bike', function postcssBike(options) {

  return root => {

    options = options || {};

    const setSelector = (node) => {
      if (node.name === 'component') {
        return `.${node.params}`;
      }

      if (node.name === 'elem') {
        return `${node.parent.selector}__${node.params}`;
      }

      if (node.name === 'mod') {
        let modVal = node.params.match(/(\w+)\[(\w+)\]/);

        if (!modVal) {
          return `${node.parent.selector}_${node.params}`;
        }

        if (modVal) {
          return `${node.parent.selector}_${modVal[1]}_${modVal[2]}`;
        }
      }
    }

    const process = (node) => {
      if (node.params === undefined) {
        return node;
      }

      if (!node.nodes.length) {
        return node;
      }

      const rule = postcss.rule({
        raws: { semicolon: true },
        selector: setSelector(node),
        source: node.source
      })

      node.each(child => {
        if (child.type === 'decl') {
          let decl = postcss.decl({
            raws: { before: '\n  ', between: ': '},
            source: child.source,
            prop: child.prop,
            value: child.value
          });

         child.replaceWith(decl)
        }
      })

      rule.append(node.nodes);

      node.remove();

      root.append(rule);

      rule.each(child => {
        if (child.type === 'atrule' && child.name === 'mod') {
          return process(child);
        }

        if (child.type === 'atrule' && child.name === 'elem') {
          return process(child);
        }
      });
    }
    root.walkAtRules('component', process);
  }
});