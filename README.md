
# Ontology Artifact Generator

Builds a Node module containing RDF vocabulary terms taking from an Ontology (for example; schema.org). It also allows 
schemas to be extended which can be used for adding translations to terms with rdfs:labels and rdfs:comments.


# How to build

```shell
npm install
```

# How to Run

```shell
node index.ts --input <ontology files> --subjects <subjects only ontology file> --mversion <version number>
```

The output of is a Node Module containing RDF terms which is located inside the **./generated** folder.

### Examles:

Here are some examples of running the tool:

Local ontology file

```shell
node index.ts --input node./vocabs/schema.ttl
```

Multiple local ontology files

```shell
node index.ts --input ./vocabs/schema.ttl ./vocabs/schema-inrupt-ext.ttl
```

Subjects only ontology files. Generates Vocab Terms from only the specified ontology file.
```shell
node index.ts --input ./vocabs/schema.ttl --vocabTermsFrom ./vocabs/schema-inrupt-ext.ttl
```

Links to ontology file(s)
```shell
node index.ts --input  http://schema.org/Person.ttl https://schema.org/Restaurant.ttl https://schema.org/Review.ttl
```

Specifing a version for the output module
```shell
node index.ts --input "http://www.w3.org/2002/07/owl#" ./vocabs/owl-inrupt-ext.ttl --mversion 1.0.1
```

Using alaises for the input command
```shell
node index.ts --in ./vocabs/schema.ttl --vtf ./vocabs/schema-inrupt-ext.ttl --mver 1.0.6
```



# How to Deploy the module to an npm registry

To build and publish the node module run the following command:

```shell
./deploy.sh
```

**Note**: This will *only* publish the a npm registry at http://localhost:4873 (I'm running Verdaccio on my local 
machine). You will need to edit the script if you want to publish to another localtion.

Make sure that you have incremented the version of the module so that it can published.


# Creating extension file

For some examples see: 

- [./vocabs/schema-inrupt-ext.tt](./vocabs/schema-inrupt-ext.ttl)
- [./vocabs/vcard-inrupt-ext.tt](./vocabs/vcard-inrupt-ext.ttl)
- [./vocabs/owl-inrupt-ext.tt](./vocabs/owl-inrupt-ext.ttl)