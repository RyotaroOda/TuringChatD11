// クイズの問題データを定義 (暫定的にいくつか用意)
export type Question = {
  question: string;
  options: string[];
  correctIndices: number[]; // 複数正解に対応
  explanation: string;
};

export type QuizSet = {
  id: string;
  title: string;
  difficulty?: "基礎レベル" | "応用レベル" | "上級レベル" | string;
  questions: Question[];
};

export const quizSets: QuizSet[] = [
  // (a) 生成AIの基礎知識
  {
    id: "quizAiBasicOperation",
    title: "1.生成AIの基礎知識",
    difficulty: "基礎レベル",
    questions: [
      {
        question:
          "生成AIを利用するとき、まず最初に行うべきことは何でしょうか？",
        options: [
          "AIのアルゴリズムを自分で書き直す",
          "ツールの利用規約や使い方のガイドを確認する",
          "ソースコードをすべて公開する",
          "学習に使われているサーバーを自分で準備する",
        ],
        correctIndices: [1],
        explanation:
          "まずはサービスの利用規約・使い方を確認し、目的に適ったツールを選ぶことが大切です。",
      },
      {
        question:
          "AIに指示を与える「プロンプト」を入力するときに意識すべきことはどれでしょうか？",
        options: [
          "できるだけ英語を使わないこと",
          "なるべく抽象的に書くこと",
          "具体的でわかりやすい要望を伝えること",
          "固定の文章で毎回同じ指示を繰り返すこと",
        ],
        correctIndices: [2],
        explanation:
          "生成AIはプロンプトを手がかりに応答を作ります。曖昧な指示だと期待する回答が得にくいので、具体的かつ明確な要望を入力しましょう。",
      },
      {
        question:
          "画像生成AIにイラストを描いてもらうとき、どのような操作が最も重要でしょうか？",
        options: [
          "AIのソースコードを自力で全面改修する",
          "描いてほしいイメージをできるだけ具体的に伝える(プロンプト)",
          "画像の解像度をどんなに大きくしてもOK",
          "AIがランダムに出力するため、操作は不要",
        ],
        correctIndices: [1],
        explanation:
          "画像生成AIの多くは、文章による指定 (プロンプト) が重要です。構図や色合い、イメージを細かく指定するほど狙いに近い画像を得やすくなります。",
      },
      {
        question:
          "文章生成AIが返してきた内容を確認する際、どのような点をチェックすべきでしょうか？",
        options: [
          "文章の長さだけをチェックする",
          "誤字脱字や文体、内容に間違いがないかなどを確認する",
          "必ずAIが完璧なのでチェック不要",
          "文章が短い場合はすべて削除する",
        ],
        correctIndices: [1],
        explanation:
          "生成AIの出力は便利ですが、誤字脱字や事実誤認が含まれることがあるため、利用者側で内容をしっかりチェックする必要があります。",
      },
      {
        question:
          "生成AIツールを安全に使うための最初のステップとして適切なものは？",
        options: [
          "個人情報をすべてAIに提供してテストする",
          "ブラウザのセキュリティ設定をすべてオフにする",
          "利用規約を読み、データの取り扱い方針を把握する",
          "検索エンジンにAIのパスワードを入力する",
        ],
        correctIndices: [2],
        explanation:
          "特にオンラインの生成AIツールを使う場合は、利用規約やプライバシーポリシーを理解することが重要です。",
      },
    ],
  },

  // (b) 生成AIの仕組み
  {
    id: "quizAiMechanism",
    title: "2.生成AIの仕組み",
    difficulty: "基礎レベル",
    questions: [
      {
        question:
          "大規模言語モデル(LLM)が文章を生成する仕組みに関して正しい説明はどれでしょうか？",
        options: [
          "人間と同じように直感で文章を作っている",
          "事前学習したテキストの統計的パターンをもとに単語を推定する",
          "ユーザーの脳波を読み取って文章を作る",
          "意識を持って感情表現を行う",
        ],
        correctIndices: [1],
        explanation:
          "LLM は膨大なコーパスを学習し、確率的に次に来る単語を予測する仕組みによって文章を生成します。",
      },
      {
        question:
          "「パラメータが多いモデルほど高性能」とは一概に言えない理由は何でしょうか？",
        options: [
          "モデル性能とは無関係にパラメータを増やせば良いから",
          "学習データやアルゴリズムの最適化、推論環境なども性能に大きく影響するから",
          "パラメータはゼロでなければならないから",
          "パラメータを増やすと一切学習できなくなるから",
        ],
        correctIndices: [1],
        explanation:
          "パラメータ数を増やしても、学習データの質やアルゴリズムの工夫、計算資源の確保などが伴わなければ十分な性能向上は望めません。",
      },
      {
        question: "生成AIでよく使われる「トークン」とは何を指しますか？",
        options: [
          "AIが有償サービスを利用するためのコイン",
          "テキストを小さな単位(単語やサブワードなど)に分割したもの",
          "プログラマが使う全角スペースの通称",
          "暗号通貨の一種",
        ],
        correctIndices: [1],
        explanation:
          "多くの言語モデルでは、文章中の単語やサブワードなどを「トークン」という単位に分割し、それぞれのトークンを次に予測する形で文章を生成します。",
      },
      {
        question:
          "生成AIにおける「事前学習(Pre-training)」とは何を指しますか？",
        options: [
          "ユーザーがAIに手動で正解を教えるプロセス",
          "大規模なコーパスを使い、一般的な言語(または画像)の特徴を学習させる工程",
          "ユニークな文章を一度で生成する工程",
          "AIが一切学習をせずに動く工程",
        ],
        correctIndices: [1],
        explanation:
          "事前学習とは、膨大なデータセットを使い、一般的な言語の特徴や文脈を学習する工程です。その後、ファインチューニングなどを行い、特定のタスクに最適化します。",
      },
      {
        question: "「推論(Inference)」工程で正しい説明はどれでしょうか？",
        options: [
          "AIが学習データを集めるフェーズ",
          "すでに学習したモデルを使って新しい入力に応答を生成するフェーズ",
          "モデルを圧縮して小さくするフェーズ",
          "ユーザーがモデルを逆向きに学習させるフェーズ",
        ],
        correctIndices: [1],
        explanation:
          "推論(Inference)とは、学習済みモデルを用いて実際に文章や画像などを生成する工程のことです。",
      },
    ],
  },

  // (c) 生成AIの生成物の特徴
  {
    id: "quizAiFeature",
    title: "3.生成AIの生成物の特徴",
    difficulty: "基礎レベル",
    questions: [
      //【例題2】を採用
      {
        question:
          "生成AIでの検索結果が他の文献やサイトと食い違う場合、どのように対応するのが良いでしょうか？",
        options: [
          "AIは正しいので他の情報は無視する",
          "AIは間違っているので、検索をやめる",
          "AIがなぜその答えを出したのか理由を調べ、複数の情報源と照らし合わせる",
          "どちらが正しいか判断する必要はない",
        ],
        correctIndices: [2],
        explanation:
          "複数の情報源を確認し、なぜAIがそのような出力をしたかを考察することが重要です。",
      },
      //【例題3】複数正解
      {
        question:
          "生成AIやインターネット上の情報を利用するときに、信頼性を確認するための正しいアプローチはどれでしょうか。すべて選びなさい。",
        options: [
          "生成AIが出力した情報なら常に正しいと思い込む",
          "複数の情報源で内容を確認し、比較する",
          "回答内容に矛盾を感じたら、他のソースで確かめる",
          "AIが難しい言葉を使っていれば正しい情報だと判断する",
        ],
        correctIndices: [1, 2],
        explanation:
          "複数の情報源で比較したり、矛盾がある場合は追加で確認するなど、常に真偽を検証する姿勢が大切です。",
      },
      //【例題4】複数正解
      {
        question:
          "生成AIが回答をくれたとき、その内容をどう判断するのがよいでしょうか。すべて選びなさい。",
        options: [
          "信憑性を考えずに受け入れる",
          "自分の知っている知識や経験と照らし合わせる",
          "必要に応じて他の人や書籍などで補強する",
          "疑問点があれば自分でさらに調査する",
        ],
        correctIndices: [1, 2, 3],
        explanation:
          "AIの出力は一つの参考情報として活用し、自分の知識や他の信頼できる情報源を組み合わせるのが望ましいです。",
      },
      //【例題7】複数正解
      {
        question:
          "あなたは生成AIを用いて「地域の歴史」を調べるレポート課題に取り組んでいます。妥当な行動はどれでしょうか。すべて選びなさい。",
        options: [
          "AIに自分の住所や連絡先を伝えて調べてもらう",
          "AIの情報ソースがどこかを確認する",
          "AIが伝えてくれた内容と図書館や他のWeb資料の情報を照らし合わせる",
          "レポートにAIの回答をまるごとコピーして貼り付ける",
        ],
        correctIndices: [1, 2],
        explanation:
          "個人情報をAIに伝えるのは望ましくありません。AIが提示するデータの出典を確認し、他の信頼できる資料と照合することが大切です。",
      },
      // 新規追加 (c) 向け5問目
      {
        question:
          "生成AIが作った文章は、人間が作った文章と比べてどのような特徴が見られる場合が多いでしょうか？",
        options: [
          "必ず誤りのない高度な文章になる",
          "学習データの偏りを反映して、ステレオタイプな表現が出る場合がある",
          "必ずユーザーに理解できない単語を多用する",
          "文章中に必ずAIだと分かるマークを入れる",
        ],
        correctIndices: [1],
        explanation:
          "AIは膨大な学習データに依存するため、データの偏りに由来するステレオタイプやバイアスを含んでしまうことがあります。",
      },
    ],
  },

  // (d) 生成AIの目的に応じたカスタマイズ方法
  {
    id: "quizAiCustomize",
    title: "4.生成AIの目的に応じたカスタマイズ方法",
    difficulty: "基礎レベル",
    questions: [
      {
        question:
          "AIに小説風の文章を書かせたいとき、どのようにプロンプトやパラメータを調節するとよいでしょうか？",
        options: [
          "小説風と言わず、短く書くとだけ指定する",
          "ストーリーのあらすじ、文体、キャラクター設定などを具体的に指示する",
          "AI側のモデルを完全に書き換える",
          "カスタマイズする必要はまったくない",
        ],
        correctIndices: [1],
        explanation:
          "文体や内容を具体的に指示することで、小説風の物語のような文章を作りやすくなります。",
      },
      {
        question:
          "翻訳AIをうまく使うポイントとして適切なものはどれでしょうか？",
        options: [
          "まず翻訳前の文章を機械可読フォーマットにすべて変換する",
          "方言やスラングを大量に含め、あいまいな表現のままAIに丸投げする",
          "出来るだけ明確で文法的に整った原文を用意する",
          "翻訳AIは特別なチューニングができないので好きに使う",
        ],
        correctIndices: [2],
        explanation:
          "原文が整理されているほど、翻訳AIも適切な訳を出しやすくなります。誤字や文法ミスが多い場合は正確さが低下しがちです。",
      },
      {
        question:
          "絵画風と写真風のどちらのスタイルを希望するかをAIに示すときに有効なのはどれでしょうか？",
        options: [
          'プロンプトでスタイルを明確に指定する（例："油絵風"、"リアルな写真風" など）',
          "AIにスタイル指定は不可能なのでアイデアを諦める",
          "モデルのソースコードを直接変更するしかない",
          "文章の長さだけを気にすればよい",
        ],
        correctIndices: [0],
        explanation:
          "画像生成AIなどでは「どんなスタイルで生成してほしいか」をキーワードで具体的に伝えるのがポイントです。",
      },
      {
        question:
          "生成AIをカスタマイズするとき、「温度(temperature)」パラメータを上げる効果は？",
        options: [
          "文章の論理性を大幅に向上させる",
          "よりランダム性が増し、独創的な文が生まれやすくなる",
          "AIがエラーを起こしやすくなるだけ",
          "学習が高速化する",
        ],
        correctIndices: [1],
        explanation:
          "temperature を高めると出力に遊び(ランダム性)が増し、予測確率の低い単語も選ばれやすくなるため、独創的な文章を生み出す傾向があります。",
      },
      {
        question:
          "特定の文体や専門用語を多用した文章を生成させたいときに有効な手段はどれでしょうか？",
        options: [
          "AIに全く指示を与えずに試行回数だけ増やす",
          "「こんな専門用語を使ってほしい」とプロンプトで具体的に示す",
          "利用規約に反する行為をして根本からモデルを改変する",
          "AIが自発的に学習を行うのを待つ",
        ],
        correctIndices: [1],
        explanation:
          "専門用語や文体のキーワードや例文をプロンプトで具体的に示すことで、AIに狙い通りの出力をさせやすくなります。",
      },
    ],
  },

  // (e) 生成AIの利用に伴うリスクや倫理的課題
  {
    id: "quizAiEthics",
    title: "5.生成AIの利用に伴うリスクや倫理的課題",
    difficulty: "基礎レベル",
    questions: [
      //【例題1】
      {
        question:
          "インターネット上で生成AIが作ったコンテンツを利用するときに気をつけたいのはどれでしょうか？",
        options: [
          "パブリックドメインなら何でも自由に使える",
          "著作権や使用ルールを守り、引用元を明示する",
          "無料で利用できるサービスなら許可はいらない",
          "生成AIで作った作品には著作権がないので、コピーしても問題ない",
        ],
        correctIndices: [1],
        explanation:
          "生成AIコンテンツでも著作権や使用ルールの遵守、出典明示などが必要です。自動生成だからといって著作権が消えるわけではありません。",
      },
      //【例題5】複数正解
      {
        question:
          "あなたは読書感想文を早く終わらせたいと考え、生成AIに原稿を作成してもらいました。正しい対応はどれでしょうか？すべて選びなさい。",
        options: [
          "AIが作った文章をそのままコピペして提出する",
          "AIが出力した文章を確認し、自分の言葉に合うように書き直す",
          "内容に誤りがないか、参考文献や事実関係を自分で再チェックする",
          "AIが生成した文章はすべて正しいと信じる",
        ],
        correctIndices: [1, 2],
        explanation:
          "AI出力をそのまま利用するのは不適切です。自分の言葉に書き直し、事実確認・参考文献の明示をすることが重要です。",
      },
      //【例題6】複数正解
      {
        question:
          "プレゼン資料を作る際に、生成AIに「スライドに使える短い英語フレーズを考えて」と依頼しました。適切な行動はどれでしょうか？すべて選びなさい。",
        options: [
          "AIが出したフレーズはすべて自分のオリジナルとして扱って良い",
          "AIが提案したフレーズをそのまま引用する場合は、出典やAIを利用したことを明記する",
          "プレゼンで使う前に、英語として誤りがないか先生や辞書を使って確認する",
          "提案されたフレーズの意味を自分できちんと理解してから使う",
        ],
        correctIndices: [1, 2, 3],
        explanation:
          "AIの提案は著作権表記や文法チェックなどが必要です。フレーズの意味を理解して使わないと誤った表現になる可能性もあります。",
      },
      //【例題8】
      {
        question:
          "ChatGPTなどの生成AIを利用するとき、年齢制限について正しい説明はどれでしょうか？",
        options: [
          "13歳以上は親の許可があれば自由に利用できる",
          "20歳以上でなければ利用できない",
          "誰でも自由に使える",
          "18歳以上だけが自由に使える",
        ],
        correctIndices: [0],
        explanation:
          "多くのサービスは「13歳以上であること、18歳未満は親や保護者の許可が必要」などの規定があります。必ず最新の利用規約を確認しましょう。",
      },
      // 新規追加 (e) 向け5問目
      {
        question:
          "生成AIの利用においてプライバシー保護が求められる理由として最も適切なのはどれでしょうか？",
        options: [
          "AIはすべての情報を必ず匿名化するので問題ない",
          "ユーザーが入力した個人情報や秘密情報が学習や解析に使われる可能性があるため",
          "アルゴリズムがブラックボックスであるためプライバシーは常に安全",
          "AIの利用にはとくに制限がないので自由に使える",
        ],
        correctIndices: [1],
        explanation:
          "生成AIに入力した情報が第三者に渡るリスクや、学習や解析に使われる可能性があるため、プライバシー保護が重要です。",
      },
    ],
  },
  {
    id: "quizAiToolsBasic",
    title: "実際に生成AIを用いたツールについて",
    difficulty: "基礎レベル",
    questions: [
      {
        question:
          "文章生成AIを用いてメールの下書きを作成するときに最も大切なことは？",
        options: [
          "常に有料プランを使う",
          "ソースコードをすべて改変する",
          "適切な指示を与え、出力を人間がチェックする",
          "AIの出力はそのまま送信するだけで良い",
        ],
        correctIndices: [2],
        explanation:
          "AIを使う際は、プロンプトの工夫と最終的な人間による確認が必要です。",
      },
      {
        question: "画像生成AIを使うときに気をつけるべきことは？",
        options: [
          "著作権・利用規約を確認する",
          "画像は必ず創作物なので自由に使える",
          "サービスによっては著作権そのものが無い",
          "画像の解像度は意味がない",
        ],
        correctIndices: [0],
        explanation:
          "画像生成AIの利用規約や著作権の取り扱いはサービスごとに異なるため、必ず確認しましょう。",
      },
      {
        question: "ChatGPTに対してプロンプトを工夫するメリットは？",
        options: [
          "回答の質が向上する可能性がある",
          "常に正解を出すことが保証される",
          "ソースコードが改変される",
          "特にメリットはない",
        ],
        correctIndices: [0],
        explanation:
          "具体的な指示を与えるほど、期待する回答へ近づける可能性が高まります。",
      },
      {
        question: "多くの生成AIサービスの利用に必要なものとして適切なのは？",
        options: [
          "安定したネット環境と利用目的の明確化",
          "モデルの全コードを自前で動かす必要がある",
          "一切規約を読まなくても良い",
          "無制限に高解像度の画像を生成できる",
        ],
        correctIndices: [0],
        explanation:
          "オンライン上で動くため回線は重要。どんな出力が欲しいか目的を明確にすると活用しやすいです。",
      },
      {
        question: "文章生成AIを「文章の校正」に活用するときに注意すべき点は？",
        options: [
          "校正結果を必ず鵜呑みにする",
          "誤りや文脈のズレがないか、人間が最終確認する",
          "AIに修正を丸投げする",
          "常に無料版では信用できない",
        ],
        correctIndices: [1],
        explanation:
          "AIの校正提案も完璧ではないため、人間のチェック・修正が必要です。",
      },
    ],
  },
  {
    id: "quizNlpAdvanced",
    title: "自然言語処理",
    difficulty: "応用レベル",
    questions: [
      {
        question:
          "Transformerアーキテクチャの自己注意(self-attention)機構の役割は？",
        options: [
          "すべてRNNベースで処理を高速化する",
          "各トークン同士の依存関係を並列的に学習する",
          "同義語を辞書から検索する",
          "単語の順序を固定して処理する",
        ],
        correctIndices: [1],
        explanation:
          "自己注意機構は文の単語同士の依存関係を並列で捉えることで、長文にも対応しやすくなります。",
      },
      {
        question: "Word2Vecなどの単語分散表現モデルの利点で誤っているものは？",
        options: [
          "類似単語を空間上で近くに表現できる",
          "単語間の類似度を数値(ベクトル距離)で扱いやすい",
          "単語順序をそのまま保存する",
          "大量のコーパスで自己教師的に学習可能",
        ],
        correctIndices: [2], // "単語順序をそのまま保存する" は誤り
        explanation:
          "Word2Vecは単語をベクトル化するが、文の構文や順序を直接保持するわけではありません。",
      },
      {
        question:
          "BERT が従来の片方向言語モデルと大きく異なる点は何でしょうか？",
        options: [
          "まったく学習をしない",
          "マスクされたトークンを推定し、双方向の文脈を考慮する",
          "すべて単方向RNNを使う",
          "正規表現だけで学習を行う",
        ],
        correctIndices: [1],
        explanation:
          "BERTは隠された単語を推定する「Mask LM」などにより、前後両方向の文脈を学習します。",
      },
      {
        question: "GPT 系列モデルが「次トークン予測」を行う主な意義は？",
        options: [
          "大量のラベル付きデータが必須である",
          "自己教師学習により大規模データを活用しやすい",
          "必ず計算量が減る",
          "教師は人間ではなくロボットのみ",
        ],
        correctIndices: [1],
        explanation:
          "次トークン予測は自己教師学習の形を取り、ラベル付け不要で膨大なコーパスを学習できるのが利点です。",
      },
      {
        question: "トークナイザ(tokenizer)によるサブワード分割が重要な理由は？",
        options: [
          "未知単語を細分化して扱い、柔軟性を高める",
          "文字コードをASCIIだけに限定する",
          "文法構造を完璧に復元する",
          "語彙を極端に小さくする",
        ],
        correctIndices: [0],
        explanation:
          "サブワードに分解することで、新しい単語や複合語にも対応でき、単純にOOVにならない点がメリットです。",
      },
      {
        question:
          "言い換え(パラフレーズ)生成などのNLGタスクを評価する自動指標として一般的なものはどれ？",
        options: [
          "BLEU や ROUGE",
          "BoW (Bag of Words) のみ",
          "すべて手作業",
          "構文木の深さ",
        ],
        correctIndices: [0],
        explanation:
          "NLGの出力品質を客観的に評価するためによく用いられるのが BLEU, ROUGE などの自動評価指標です。",
      },
      {
        question: "モデルを微調整(Fine-tuning)する際に行わない方がよいのは？",
        options: [
          "学習率やバッチサイズを調整する",
          "事前学習済みモデルの重みをすべてリセットして初期化する",
          "タスクデータに合わせて損失関数を設定する",
          "過学習を防ぐためにEarly Stoppingなどを活用する",
        ],
        correctIndices: [1],
        explanation:
          "微調整とは、事前学習済みモデルの重みを活用することが前提なので、完全にリセットするのは本末転倒です。",
      },
      {
        question: "Seq2SeqモデルにおけるAttention機構の役割で正しいのは？",
        options: [
          "入力文の各単語が出力文に与える影響度を学習する",
          "文章の長さを常に固定にする",
          "過学習を助長する目的だけ",
          "出力文は入力とあまり関係がない",
        ],
        correctIndices: [0],
        explanation:
          "翻訳などで、入力文のどの部分を参照すべきかを学習し、正確な出力を生み出す手がかりとなります。",
      },
      {
        question:
          "大規模言語モデルの利用で懸念される点として誤っているものは？",
        options: [
          "バイアスや誤情報が学習される可能性がある",
          "ユーザーがモデルを誤った認識で利用することがある",
          "一度完成するとコンテキスト長は無制限になる",
          "社会的影響が大きい分、倫理面や法規制が課題になる",
        ],
        correctIndices: [2], // 無制限にはならない
        explanation:
          "多くのモデルはコンテキスト長に限界があり、無制限には扱えません。また、法規制やバイアスなど代替的な懸念は現実的です。",
      },
      {
        question:
          "異なる分野(domain)のデータで推論させる際に特に考慮すべきことは？",
        options: [
          "ドメインシフトにより精度が落ちる可能性",
          "必ず精度が上がる",
          "教師データが完全になくても問題ない",
          "膨大なメモリ使用量になる",
        ],
        correctIndices: [0],
        explanation:
          "モデルが学習した分野とは異なるドメインにも適用したい場合、追加学習やデータの準備が必要になることがあります。",
      },
    ],
  },
  {
    id: "quizMlAdvanced",
    title: "機械学習",
    difficulty: "応用レベル",
    questions: [
      {
        question:
          "アンサンブル学習(Ensemble Learning)のメリットとして正しいのは？",
        options: [
          "モデルを1つにした方が常に精度が高い",
          "複数モデルを組み合わせることで汎化性能を高める",
          "学習データの削除が前提",
          "計算負荷が必ず減る",
        ],
        correctIndices: [1],
        explanation:
          "アンサンブルはモデルの弱点を相殺し合い、より安定した高い精度を得られる手法です。",
      },
      {
        question:
          "過学習(オーバーフィッティング)を防ぐ手段として誤っているのは？",
        options: [
          "Early Stopping の活用",
          "正則化(L1/L2)の導入",
          "大量の学習データを削除する",
          "データ拡張などを利用し汎化性能を向上",
        ],
        correctIndices: [2],
        explanation:
          "学習データが少ないほど過学習の危険性はむしろ高まる場合が多いです。",
      },
      {
        question: "バッチ正規化(Batch Normalization)の目的は？",
        options: [
          "勾配消失を防ぎ学習を安定化させる",
          "重みをすべてランダムに戻す",
          "ドロップアウト率を上げる",
          "必ず学習率を自動調整する",
        ],
        correctIndices: [0],
        explanation:
          "各層の出力のばらつきを抑え、勾配が安定しやすくなり学習効率が向上します。",
      },
      {
        question: "決定木ベースの勾配ブースティング手法(XGBoostなど)の特徴は？",
        options: [
          "線形回帰のみを行う",
          "木を逐次追加し、残差を補正しながらブーストする",
          "GPU専用でしか動作しない",
          "過学習を必ず起こす",
        ],
        correctIndices: [1],
        explanation:
          "勾配ブースティングは、残差を減らすように新しい木を追加していくことで精度を高める手法です。",
      },
      {
        question:
          "SGD(確率的勾配降下法)を改良したオプティマイザに含まれないのは？",
        options: ["Momentum", "AdaGrad", "Adam", "K-Means"],
        correctIndices: [3],
        explanation:
          "K-Meansはクラスタリング手法であり、SGDの拡張オプティマイザではありません。",
      },
      {
        question:
          "ハイパーパラメータ探索において、ランダムサーチがグリッドサーチよりも効率的な場合があるのはなぜ？",
        options: [
          "必ず最適解が得られるから",
          "高次元空間で幅広く探索しやすいから",
          "グリッドサーチでは並列化が不可能であるから",
          "分布を一切考慮しないから効率的",
        ],
        correctIndices: [1],
        explanation:
          "特に次元が多い場合、ランダムにサンプリングした方が広域をカバーしやすく、計算量も抑えられます。",
      },
      {
        question: "オンライン学習(Online Learning)の特徴として正しいのは？",
        options: [
          "全データをバッチでまとめて学習する",
          "部分的にモデルを初期化する",
          "新しいデータが到着するたびに少しずつモデルを更新する",
          "固定のデータセットのみを使う",
        ],
        correctIndices: [2],
        explanation:
          "オンライン学習ではストリーミング的に新規データを取り込み、モデルを継続的に更新できます。",
      },
      {
        question: "確率過程モデルとして遷移行列を用いる手法は？",
        options: [
          "マルコフ決定過程(MDP)",
          "KNN (k近傍法)",
          "ID3(決定木)",
          "PCA(主成分分析)",
        ],
        correctIndices: [0],
        explanation:
          "マルコフ決定過程は状態遷移確率行列や報酬などから方策を導く枠組みです。",
      },
      {
        question: "PCA(主成分分析)の主な目的は？",
        options: [
          "教師データを用いた分類",
          "次元を増やす",
          "データの分散が大きい軸を抽出し次元圧縮する",
          "ユニークなクラスタを生成する",
        ],
        correctIndices: [2],
        explanation:
          "主成分を抽出して、高次元データを低次元に圧縮しつつ、情報の重要部分を保持します。",
      },
      {
        question: "学習率(learning rate)を極端に大きくすると起こり得る問題は？",
        options: [
          "必ず最高精度になる",
          "収束せずに発散するリスクがある",
          "学習データの破棄が必要",
          "まったく学習が始まらない",
        ],
        correctIndices: [1],
        explanation:
          "ステップが大きすぎると最適解を飛び越え、勾配が暴走して発散してしまう可能性があります。",
      },
    ],
  },
  {
    id: "quizPromptEngineeringAdvanced",
    title: "プロンプトエンジニアリング",
    difficulty: "応用レベル",
    questions: [
      {
        question: "システムプロンプト(system prompt)の主な目的は？",
        options: [
          "APIキーをモデルに渡すためだけ",
          "モデル全体をクラッシュさせるため",
          "モデルの役割や口調などの全体的方針を制御する",
          "モデルに完全な自由を与える",
        ],
        correctIndices: [2],
        explanation:
          "システムプロンプトでは「AIの人格設定」「口調」などを指定し、大まかな方向性をコントロールします。",
      },
      {
        question:
          "「少しずつ追加指示を与え、段階的に生成内容を修正する」アプローチを何と呼ぶ？",
        options: [
          "プログレッシブプロンプト",
          "フルシャッフルプロンプト",
          "ノイズ誘発プロンプト",
          "一度だけの指示",
        ],
        correctIndices: [0],
        explanation:
          "プログレッシブプロンプト(あるいは段階的プロンプト)と呼ばれる手法で、複数ブロックに分けて目的達成を導きます。",
      },
      {
        question: "Chain-of-Thought 促進の狙いは何か？",
        options: [
          "モデルに推論プロセスを明確に書かせ、論理的で一貫性のある回答を得る手法",
          "モデルのメモリを圧縮する",
          "一切モデルの思考過程を見せない",
          "出力をランダムにする",
        ],
        correctIndices: [0],
        explanation:
          "推論ステップを明示させることで、回答の論理性を高める狙いがあります。",
      },
      {
        question:
          "プロンプトエンジニアリングでハルシネーション(誤情報)を減らすには？",
        options: [
          "根拠となる情報源を提示し参照させる",
          "モデルを曖昧にさせる",
          "タイポを増やす",
          "指示を短くする",
        ],
        correctIndices: [0],
        explanation:
          "具体的な根拠（引用文献など）を提示し、それを参照するようモデルに促すことで誤情報を減らせる場合があります。",
      },
      {
        question:
          "Zero-shot promptingとの比較で、Few-shot promptingが有効なのは何故？",
        options: [
          "例示に沿って回答を作りやすくなる",
          "モデルの内部構造を書き換える",
          "学習データをほぼ削除できる",
          "すべての応答が短くなる",
        ],
        correctIndices: [0],
        explanation:
          "あらかじめ具体的な例(サンプル入力と理想的な出力)を示すことで、モデルにタスクの形式・期待回答パターンを教えられます。",
      },
      {
        question: "ロールプレイ(役割設定)をプロンプトに含む目的は？",
        options: [
          "単に出力を翻訳だけする",
          "モデルに何も説明せずに専門用語を使わせる",
          "「あなたは法律の専門家です」などの背景を設定して応答の口調や内容を調整する",
          "モデルのソースコードを自動生成する",
        ],
        correctIndices: [2],
        explanation:
          "ロールプレイを定義すると、モデルがその役割にあった語彙や文体で回答を生成しやすくなります。",
      },
      {
        question: "プロンプトが長すぎると起こる問題は？",
        options: [
          "必ず処理速度が上がる",
          "読まれずに切り捨てられる箇所が出る可能性がある(トークン数制限)",
          "モデルがすべてを吸収し最適化してくれる",
          "特に問題はない",
        ],
        correctIndices: [1],
        explanation:
          "モデルやAPIにはトークン数制限があり、超過部分が無視される・エラーになるなどのリスクがあります。",
      },
      {
        question:
          "複数ステップの指示をひとつのプロンプトにまとめる際、避けるべきことは？",
        options: [
          "箇条書きでステップを整理する",
          "タスクの前提条件をわかりやすく書く",
          "情報を混乱させるように全て雑然と書く",
          "ユーザーが読みやすい書式にする",
        ],
        correctIndices: [2],
        explanation:
          "前提条件を整理せずにぐちゃぐちゃに書くと、モデルが意図を正しく読み取れなくなりやすいです。",
      },
      {
        question: "プロンプトの成功率を測る際に大切なのは？",
        options: [
          "1度のテストだけで評価を完了する",
          "複数回試行し、どれほど目的を満たす回答が得られるか統計的に見る",
          "モデルバージョンによる影響は皆無",
          "厳格な基準は不要",
        ],
        correctIndices: [1],
        explanation:
          "同じプロンプトでもバージョンや状態により結果が変化するため、十分な試行回数で成功率を確認する必要があります。",
      },
      {
        question:
          "高品質なプロンプトを他の大規模言語モデルでも使いまわす場合、留意すべき点は？",
        options: [
          "コンテキスト長やトークナイザ仕様が異なる可能性がある",
          "全モデルで常に同様の応答を期待できる",
          "ファインチューニング前提のため使えない",
          "事前学習で分散表現が消える",
        ],
        correctIndices: [0],
        explanation:
          "モデルごとにコンテキスト長やトークン化方式、対応言語仕様などが異なるため、そのまま流用できない場合があります。",
      },
    ],
  },
];