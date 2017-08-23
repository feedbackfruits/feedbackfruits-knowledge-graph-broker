"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isQuad = (quad) => {
    return quad != null &&
        typeof quad === 'object' &&
        typeof quad['subject'] === 'string' &&
        typeof quad['predicate'] === 'string' &&
        typeof quad['object'] === 'string';
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVhZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9xdWFkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBT2EsUUFBQSxNQUFNLEdBQUcsQ0FBQyxJQUFZO0lBQ2pDLE1BQU0sQ0FBQyxJQUFJLElBQUksSUFBSTtRQUNaLE9BQU8sSUFBSSxLQUFLLFFBQVE7UUFDeEIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssUUFBUTtRQUNuQyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxRQUFRO1FBQ3JDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLFFBQVEsQ0FBQztBQUM1QyxDQUFDLENBQUMifQ==