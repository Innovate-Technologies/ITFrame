import ExtendableError from "~/components/ExtendableError";

export default class NotFoundError extends ExtendableError {
    constructor(m) {
        super(m);
    }
}
