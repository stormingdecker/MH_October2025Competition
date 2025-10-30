export enum NPCDialogueType {
  ClientArrival,
  ClientOrdering,
  ClientGiveUpWaiting,
  ClientReceiving,
  ClientDeparting,
  MerchantGreeting,
  MerchantFarewell,
}

export class NPCScript {
  public static getLine(dialogueType: NPCDialogueType) {
    switch (dialogueType) {
      case NPCDialogueType.ClientArrival:
        return NPCScript.getClientArrivalLine();
      case NPCDialogueType.ClientOrdering:
        return NPCScript.getClientOrderingLine();
      case NPCDialogueType.ClientGiveUpWaiting:
        return NPCScript.getClientGiveUpWaitingLine();
      case NPCDialogueType.ClientReceiving:
        return NPCScript.getClientReceivingLine();
      case NPCDialogueType.ClientDeparting:
        return NPCScript.getClientDepartingLine();
      case NPCDialogueType.MerchantGreeting:
        return NPCScript.getMerchantGreetingLine();
      case NPCDialogueType.MerchantFarewell:
        return NPCScript.getMerchantFarewellLine();
    }
  }

  public static getClientArrivalLine() {
    const lines = NPCScript.clientArrivalLines;
    return lines[Math.floor(Math.random() * lines.length)];
  }

  public static getClientOrderingLine() {
    const lines = NPCScript.clientOrderingLines;
    return lines[Math.floor(Math.random() * lines.length)];
  }

  public static getClientGiveUpWaitingLine() {
    const lines = NPCScript.clientGiveUpWaitingLines;
    return lines[Math.floor(Math.random() * lines.length)];
  }

  public static getClientReceivingLine() {
    const lines = NPCScript.clientReceivingLines;
    return lines[Math.floor(Math.random() * lines.length)];
  }

  public static getClientDepartingLine() {
    const lines = NPCScript.clientDepartingLines;
    return lines[Math.floor(Math.random() * lines.length)];
  }

  public static getMerchantGreetingLine() {
    const lines = NPCScript.merchantGreetingLines;
    return lines[Math.floor(Math.random() * lines.length)];
  }

  public static getMerchantFarewellLine() {
    const lines = NPCScript.merchantFarewellLines;
    return lines[Math.floor(Math.random() * lines.length)];
  }

  private static clientArrivalLines: string[] = [
    //
    "Ooo, this place smells amazing!",
    "A table for one, please!",
    "Hope I can find a cozy spot.",
    "This place is always so lively!",
    "I've been craving something tasty all day.",
    "Ooo, I love the decor!",
    "I heard the chef here is legendary.",
    "Guess who's hungry? This guy!",
    "Ahh, the perfect place to unwind.",
    "Time for a treat!",
    "Table for one noodle-doodle, please!",
    "I followed the smell of happiness right in here.",
    "Do you seat stomachs as big as mine?",
    "Hope your chairs can handle hungry wiggles!",
    "Ohh! Shiny fork, shiny spoon, shiny me!",
    "Ooo, is this where taste buds go on vacation?",
    "I saw food in the window and sprinted.",
    "Wobble, wobble, here comes trouble (and by trouble I mean hunger)!",
    "Do you serve joy? Because I'm ordering that.",
    "Warning: I may squeal when I see dessert.",
  ];

  private static clientOrderingLines: string[] = [
    //
    "I'll have the special, please!",
    "Ooo, what's your best dish?",
    "Surprise me—I trust you!",
    "One of everything! …okay, maybe not.",
    "Something sweet for my soul, please.",
    "I'll take the chef's recommendation.",
    "Hmm, tough choice… but I'll go with that one.",
    "My tummy says yes to this one!",
    "I'll try something new today!",
    "One order coming up—for me!",
    "One happiness sandwich, hold the gloom.",
    "I'll take the thing that goes munch munch wow!",
    "Surprise me, chef—I trust your delicious wizardry.",
    "What's the cheesiest thing on the menu? I want that.",
    "I'll order whatever makes me go 'yaaay!' the loudest.",
    "Excuse me, do you serve hugs on a plate?",
    "I want something spicy enough to make me hiccup.",
    "Give me the special, unless it bites back… then still give me the special.",
    "One rainbow cupcake… or ten. Ten feels safer.",
    "Food that crunches louder than my thoughts, please!",
  ];

  private static clientGiveUpWaitingLines: string[] = [
    //
    "No food? Fine, I'll just go chew on my shoe!",
    "I came for snacks, not a staring contest with an empty table.",
    "My stomach just rage-quit.",
    "Goodbye, delicious dreams… hello, sadness sandwich.",
    "I'll just go lick a rock outside, thanks!",
    "You snooze, I starve!",
    "Guess I'll go nibble on the neighbor's flowers.",
    "This chair is comfy, but not THAT comfy. I'm out!",
    "No bites, no bucks—see ya!",
    "I'm so hungry, I could eat the menu… but I won't. Goodbye!",
    "Poof! Watch me disappear faster than dessert at a birthday party.",
    "Next time, I'll bring my own sandwich.",
    "Tell the chef I said 'meh'!",
    "You can't spell 'customer service' without 'serve'… so where's mine?",
    "I'm outta here before my tummy starts growling at strangers.",
  ];

  private static clientReceivingLines: string[] = [
    //
    "Wow, it looks even better than I imagined!",
    "This is a masterpiece!",
    "Ohhh, my favorite!",
    "I can't wait to dig in—thank you!",
    "This was worth the wait!",
    "Smells heavenly!",
    "Ahhh, comfort food at last!",
    "Five stars already, and I haven't even tasted it.",
    "Yesss, food time!",
    "You're a culinary wizard!",
    "AAAAHHH it's so pretty I almost don't want to eat it! …Almost.",
    "This looks like it was made by angels with tiny spatulas.",
    "My heart just grew three sizes. Or maybe my stomach did.",
    "OH SNAP, that's my favorite!!",
    "If this isn't happiness, I don't know what is.",
    "Smells so good, my nose is doing a happy dance!",
    "I wanna frame this… but I'm also gonna eat it.",
    "Thank you chef, you absolute legend of yum.",
    "YES! My belly prophecy was true!",
    "This food and I are about to be best friends.",
  ];

  private static clientDepartingLines: string[] = [
    //
    "That was delightful—worth every coin!",
    "Best meal I've had all week!",
    "I'll definitely be back.",
    "Keep the change—you earned it!",
    "My compliments to the chef.",
    "I'm leaving stuffed and happy.",
    "This place never disappoints!",
    "Thank you for the wonderful meal!",
    "Worth every bite and every penny.",
    "Until next time, delicious friends!",
    "That was scrumdiddlyumptious!",
    "Here's my money, and a little extra sparkle for the chef.",
    "If you find crumbs on the floor… that wasn't me. (Okay it was.)",
    "I'm leaving rounder than I came in!",
    "Keep the change—buy yourself something tasty too!",
    "Tell the dishwasher I love them.",
    "10/10—would chew again.",
    "I came hungry, I leave happy, and slightly wobbly.",
    "Best meal ever—don't tell my grandma I said that.",
    "Farewell, food heroes! Until my next belly-quest!",
  ];
  private static merchantGreetingLines: string[] = [
    //
    "Welcome, welcome! Got wares shiny enough to blind a raccoon!",
    "Ah, a hungry wallet approaches!",
    "Step right up—everything here is practically wiggling to be bought.",
    "Hello, traveler! Did you come for bargains or just my dazzling smile?",
    "I've got deals so good, even I can't believe I'm selling them.",
    "Careful, my shelves are full of temptation.",
    "Greetings, customer! May your pockets be heavy and your hands grabby.",
    "Looking for food, trinkets, or just excuses to spend money?",
    "Ah, a fresh face! You look like someone who enjoys a good impulse purchase.",
    "Come closer—don't be shy! I don't bite… unless you pay extra.",
  ];

  private static merchantFarewellLines: string[] = [
    //
    "Spend wisely… or recklessly. I don't judge.",
    "Thanks for your coins! They'll be very happy with their new home.",
    "Pleasure doing business—don't forget to brag about your shiny new stuff!",
    "Goodbye, and may your pockets never be empty!",
    "Safe travels! And remember: shopping is a lifestyle, not a habit.",
    "Go forth and enjoy! Just don't return it chewed.",
    "Take care! Come back before my stock gets even weirder.",
    "Farewell! Don't trip over your overflowing bags!",
    "Every coin you spend here makes me exactly 100% happier. Thanks!",
    "See you soon, big spender—or small spender, I love you equally.",
  ];
}
