import ExtendableError from "app/components/ExtendableError";

export default class NotFoundError extends ExtendableError {
    constructor(m) {
        super(m);
    }
}
