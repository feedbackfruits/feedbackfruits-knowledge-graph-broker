"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isQuad = (quad) => {
    return typeof quad === 'object' &&
        typeof quad['subject'] === 'string' &&
        typeof quad['predicate'] === 'string' &&
        typeof quad['object'] === 'string';
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVhZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9xdWFkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBT2EsUUFBQSxNQUFNLEdBQUcsQ0FBQyxJQUFZO0lBQ2pDLE1BQU0sQ0FBQyxPQUFPLElBQUksS0FBSyxRQUFRO1FBQ3hCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLFFBQVE7UUFDbkMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssUUFBUTtRQUNyQyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxRQUFRLENBQUM7QUFDNUMsQ0FBQyxDQUFDIn0=