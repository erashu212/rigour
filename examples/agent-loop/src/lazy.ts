
export function processUserData(data: any) {
    // TODO: Add type safety here, I'm too lazy right now
    console.log("Processing data:", data);

    return {
        id: data.id,
        processed: true
    };
}
